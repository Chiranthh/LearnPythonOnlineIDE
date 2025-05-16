import os
import sys
import io
import logging
from flask import Flask, render_template, request, jsonify

# Configure logging
logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "python-code-editor-secret")

@app.route('/')
def index():
    """Render the main page with the code editor."""
    return render_template('index.html')

@app.route('/run-code', methods=['POST'])
def run_code():
    """
    Execute Python code submitted by the user.
    Handles input() prompts and returns output.
    """
    try:
        data = request.get_json()
        code = data.get('code', '')
        user_input = data.get('input', '')

        # Redirect stdin and stdout
        old_stdin = sys.stdin
        old_stdout = sys.stdout
        output = io.StringIO()
        sys.stdin = io.StringIO(user_input)
        sys.stdout = output

        # Patch input() to show prompt and use fake stdin
        input_backup = __builtins__.input
        def custom_input(prompt=''):
            print(prompt, end='')
            return sys.stdin.readline().rstrip('\n')
        __builtins__.input = custom_input

        # Execute the user's code
        exec(code, {})

        result = output.getvalue()
        success = True
        error = ''
    except Exception as e:
        result = ''
        success = False
        error = str(e)
    finally:
        # Restore original streams
        __builtins__.input = input_backup
        sys.stdin = old_stdin
        sys.stdout = old_stdout

    return jsonify({
        'success': success,
        'stdout': result,
        'stderr': error,
        'returnCode': 0 if success else 1
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)