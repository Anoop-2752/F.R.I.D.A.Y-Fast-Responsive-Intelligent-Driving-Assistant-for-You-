from langgraph.graph import StateGraph, END
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage
from typing import TypedDict, List
from tools.weather import get_weather
from tools.maps import get_route
from dotenv import load_dotenv
import os

load_dotenv()

llm = ChatGroq(
    api_key=os.getenv("GROQ_API_KEY"),
    model="llama-3.3-70b-versatile"
)

SYSTEM_PROMPT = """You are F.R.I.D.A.Y, an intelligent in-car AI co-pilot.
You are helpful, concise, and safety-aware.
Keep responses short — max 2-3 sentences.
You have access to real-time weather and navigation data when provided."""


class AgentState(TypedDict):
    message: str
    vision_context: str
    weather_data: str
    route_data: str
    response: str
    tools_used: List[str]


def router_node(state: AgentState) -> AgentState:
    message = state["message"].lower()

    needs_weather = any(word in message for word in [
        "weather", "rain", "temperature", "hot", "cold",
        "humid", "wind", "forecast", "sunny", "cloudy"
    ])

    needs_navigation = any(word in message for word in [
        "navigate", "route", "direction", "how far", "distance",
        "go to", "take me", "way to", "road to", "eta"
    ])

    tools_used = []

    if needs_weather:
        location = extract_location(message) or "Pattambi"
        weather = get_weather(location)
        state["weather_data"] = weather
        tools_used.append("weather")

    if needs_navigation:
        origin, destination = extract_route(message)
        if destination:
            route = get_route(origin, destination)
            state["route_data"] = route
            tools_used.append("navigation")

    state["tools_used"] = tools_used
    return state


def extract_location(message: str) -> str:
    keywords = ["in", "at", "for", "near"]
    words = message.split()
    for i, word in enumerate(words):
        if word in keywords and i + 1 < len(words):
            return words[i + 1].capitalize()
    return None


def extract_route(message: str) -> tuple:
    origin = "current location"
    destination = None

    keywords = ["to", "towards", "toward"]
    words = message.split()
    for i, word in enumerate(words):
        if word in keywords and i + 1 < len(words):
            destination = " ".join(words[i + 1:]).capitalize()
            break

    return origin, destination


def responder_node(state: AgentState) -> AgentState:
    context_parts = []

    if state.get("vision_context"):
        context_parts.append(f"Vision: {state['vision_context']}")

    if state.get("weather_data"):
        context_parts.append(f"Weather: {state['weather_data']}")

    if state.get("route_data"):
        context_parts.append(f"Navigation: {state['route_data']}")

    context = "\n".join(context_parts)

    full_prompt = f"{context}\n\nDriver says: {state['message']}" if context else state["message"]

    response = llm.invoke([
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=full_prompt)
    ])

    state["response"] = response.content
    return state


def build_graph() -> StateGraph:
    graph = StateGraph(AgentState)

    graph.add_node("router", router_node)
    graph.add_node("responder", responder_node)

    graph.set_entry_point("router")
    graph.add_edge("router", "responder")
    graph.add_edge("responder", END)

    return graph.compile()


friday_agent = build_graph()


def run_agent(message: str, vision_context: str = "") -> dict:
    initial_state = AgentState(
        message=message,
        vision_context=vision_context,
        weather_data="",
        route_data="",
        response="",
        tools_used=[]
    )

    result = friday_agent.invoke(initial_state)

    return {
        "response": result["response"],
        "tools_used": result["tools_used"],
        "vision_context": vision_context
    }