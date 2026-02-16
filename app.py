#!/usr/bin/env python3
"""
Interview Insights App

An application that takes in various interview notes and provides 
insights and recommendations based on those interviews.
"""

import os
import json
from anthropic import Anthropic

def main():
    """Main application entry point."""
    print("Hello World")
    print("\n=== Interview Insights App ===")
    print("Analyze interview notes and get insights & recommendations\n")
    
    client = Anthropic()
    conversation_history = []
    
    system_prompt = """You are an expert interview analyst. Your role is to:
1. Analyze interview notes provided by the user
2. Extract key themes and patterns
3. Identify strengths and areas for improvement
4. Provide actionable recommendations

Format your response with clear sections for:
- Key Themes
- Notable Insights
- Recommendations

Be concise, professional, and data-driven in your analysis."""
    
    print("Instructions:")
    print("- Type your interview notes (can be multiple lines)")
    print("- Type 'analyze' on a new line to get insights")
    print("- Type 'clear' to start fresh")
    print("- Type 'exit' to quit\n")
    
    while True:
        user_input = input("You: ").strip()
        
        if user_input.lower() == "exit":
            print("Thank you for using Interview Insights App!")
            break
        elif user_input.lower() == "clear":
            conversation_history = []
            print("Conversation cleared.\n")
            continue
        elif user_input.lower() == "analyze":
            if not conversation_history:
                print("No interview notes to analyze. Please enter some notes first.\n")
                continue
            
            # Add analysis request
            conversation_history.append({
                "role": "user",
                "content": "Please analyze these interview notes and provide insights and recommendations."
            })
            
            try:
                response = client.messages.create(
                    model="claude-3-5-sonnet-20241022",
                    max_tokens=1024,
                    system=system_prompt,
                    messages=conversation_history
                )
                
                assistant_message = response.content[0].text
                conversation_history.append({
                    "role": "assistant",
                    "content": assistant_message
                })
                
                print(f"\nAnalysis:\n{assistant_message}\n")
            except Exception as e:
                print(f"Error: {e}\n")
                conversation_history.pop()  # Remove the analysis request
        else:
            if not user_input:
                continue
            
            # Add user message to history
            conversation_history.append({
                "role": "user",
                "content": user_input
            })
            
            try:
                response = client.messages.create(
                    model="claude-3-5-sonnet-20241022",
                    max_tokens=512,
                    system="You are a helpful assistant confirming that you've received interview notes.",
                    messages=conversation_history
                )
                
                assistant_message = response.content[0].text
                conversation_history.append({
                    "role": "assistant",
                    "content": assistant_message
                })
                
                print(f"Assistant: {assistant_message}\n")
            except Exception as e:
                print(f"Error: {e}\n")
                conversation_history.pop()  # Remove the failed message

if __name__ == "__main__":
    main()
