from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import ollama  # Import the Ollama client

@csrf_exempt
def ask_ollama(request):
    """
    Django view to interact with the Ollama model.
    """
    if request.method == 'POST':
        try:
            # Get the user's question from the request
            data = request.POST
            question = data.get('question')

            if not question:
                return JsonResponse({'error': 'No question provided'}, status=400)

            # Call the Ollama model
            response = ollama.generate(model='llama3', prompt=question)

            # Return the model's response
            return JsonResponse({'response': response['response']})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    return JsonResponse({'error': 'Invalid request method'}, status=405)