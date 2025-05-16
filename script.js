document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const codeEditor = document.getElementById('codeEditor');
    const userInput = document.getElementById('userInput');
    const outputArea = document.getElementById('outputArea');
    const runCodeBtn = document.getElementById('runCodeBtn');
    const clearOutputBtn = document.getElementById('clearOutputBtn');
    const toggleThemeBtn = document.getElementById('toggleThemeBtn');
    const saveCodeBtn = document.getElementById('saveCodeBtn');
    const loadCodeBtn = document.getElementById('loadCodeBtn');
    const highlighting = document.getElementById('highlighting');
    const hljsTheme = document.getElementById('hljs-theme');

    // Verify element existence
    const elementsExist = {
        codeEditor: !!codeEditor,
        userInput: !!userInput,
        outputArea: !!outputArea,
        runCodeBtn: !!runCodeBtn,
        clearOutputBtn: !!clearOutputBtn,
        toggleThemeBtn: !!toggleThemeBtn,
        saveCodeBtn: !!saveCodeBtn,
        loadCodeBtn: !!loadCodeBtn,
        highlighting: !!highlighting,
        hljsTheme: !!hljsTheme
    };

    const missingElements = Object.entries(elementsExist)
        .filter(([_, exists]) => !exists)
        .map(([name]) => name);

    if (missingElements.length > 0) {
        console.warn('The following elements were not found:', missingElements.join(', '));
    }

    // Enable tab key insertion in code editor
    if (elementsExist.codeEditor) {
        codeEditor.addEventListener('keydown', function(e) {
            if (e.key === 'Tab') {
                e.preventDefault();
                const start = this.selectionStart;
                const end = this.selectionEnd;
                this.value = this.value.substring(0, start) + '    ' + this.value.substring(end);
                this.selectionStart = this.selectionEnd = start + 4;
                updateHighlighting();
            }
        });
    }

    // Function to update syntax highlighting
    function updateHighlighting() {
        if (!elementsExist.codeEditor || !elementsExist.highlighting) return;
        const code = codeEditor.value;
        highlighting.textContent = code;
        if (window.hljs) {
            hljs.highlightElement(highlighting);
        }
    }

    if (elementsExist.codeEditor) {
        codeEditor.addEventListener('input', updateHighlighting);
    }

    // Run code button click handler
    if (elementsExist.runCodeBtn) {
        runCodeBtn.addEventListener('click', function() {
            runCodeBtn.disabled = true;
            runCodeBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Running...';

            outputArea.textContent = 'Running your code...';
            outputArea.className = 'form-control terminal-output';

            const code = codeEditor.value;
            const input = userInput ? userInput.value : '';

            fetch('/run-code', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ code, input })
            })
            .then(response => response.json())
            .then(data => {
                let output = '';

                if (data.stdout && data.stdout.trim() !== '') {
                    output += data.stdout;
                }
                if (data.stderr && data.stderr.trim() !== '') {
                    if (output !== '') output += '\n';
                    output += `Error:\n${data.stderr}`;
                }
                if (output === '') {
                    output = 'Program executed successfully with no output.';
                }

                outputArea.className = 'form-control terminal-output ' + (data.success ? 'success-output' : 'error-output');
                outputArea.textContent = output;
            })
            .catch(error => {
                outputArea.className = 'form-control terminal-output error-output';
                outputArea.textContent = 'Error: Could not execute code.\n' + error.message;
            })
            .finally(() => {
                runCodeBtn.disabled = false;
                runCodeBtn.innerHTML = '<i class="fas fa-play me-2"></i>Run Code';
            });
        });
    }

    // Clear output button click handler
    if (elementsExist.clearOutputBtn && elementsExist.outputArea) {
        clearOutputBtn.addEventListener('click', function() {
            outputArea.className = 'form-control terminal-output';
            outputArea.textContent = 'Run your code to see the output!';
        });
    }

    // Keyboard shortcut Ctrl+Enter to run code
    if (elementsExist.runCodeBtn) {
        document.addEventListener('keydown', function(e) {
            if (e.ctrlKey && e.key === 'Enter') {
                runCodeBtn.click();
            }
        });
    }

    // Autofocus on code editor
    if (elementsExist.codeEditor) {
        codeEditor.focus();
    }

    // Dark/Light mode toggle logic
    let isDarkMode = true;

    function updateTheme() {
        if (!elementsExist.toggleThemeBtn || !elementsExist.hljsTheme) return;

        const htmlEl = document.documentElement;
        const themeIcon = toggleThemeBtn.querySelector('i');

        if (isDarkMode) {
            htmlEl.setAttribute('data-bs-theme', 'dark');
            themeIcon.className = 'fas fa-moon';
            hljsTheme.href = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/styles/atom-one-dark.min.css';
        } else {
            htmlEl.setAttribute('data-bs-theme', 'light');
            themeIcon.className = 'fas fa-sun';
            hljsTheme.href = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/styles/atom-one-light.min.css';
        }

        localStorage.setItem('pythonEditor.darkMode', isDarkMode);
    }

    if (localStorage.getItem('pythonEditor.darkMode') !== null) {
        isDarkMode = localStorage.getItem('pythonEditor.darkMode') === 'true';
        updateTheme();
    }

    if (elementsExist.toggleThemeBtn) {
        toggleThemeBtn.addEventListener('click', function() {
            isDarkMode = !isDarkMode;
            updateTheme();
        });
    }

    // Save code + input to localStorage
    function saveCodeToLocalStorage() {
        if (!elementsExist.codeEditor || !elementsExist.userInput) return;

        localStorage.setItem('pythonEditor.code', codeEditor.value);
        localStorage.setItem('pythonEditor.input', userInput.value);

        showToast('Code saved successfully!', 'success');
    }

    // Load code + input from localStorage
    function loadCodeFromLocalStorage() {
        if (!elementsExist.codeEditor || !elementsExist.userInput) return;

        const savedCode = localStorage.getItem('pythonEditor.code');
        const savedInput = localStorage.getItem('pythonEditor.input');

        if (savedCode) {
            codeEditor.value = savedCode;
            updateHighlighting();
        }
        if (savedInput) {
            userInput.value = savedInput;
        }

        showToast('Code loaded from storage!', 'info');
    }

    // Show temporary toast notifications
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `position-fixed top-0 end-0 p-3`;
        toast.style.zIndex = '1050';
        toast.innerHTML = `
            <div class="toast show align-items-center text-bg-${type} border-0" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="d-flex">
                    <div class="toast-body">
                        <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'} me-2"></i> ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>
            </div>
        `;
        document.body.appendChild(toast);

        setTimeout(() => toast.remove(), 2000);
    }

    if (elementsExist.saveCodeBtn) {
        saveCodeBtn.addEventListener('click', saveCodeToLocalStorage);
    }

    if (elementsExist.loadCodeBtn) {
        loadCodeBtn.addEventListener('click', loadCodeFromLocalStorage);
    }

    // Load code on page load if saved
    if (localStorage.getItem('pythonEditor.code') && elementsExist.codeEditor && elementsExist.userInput) {
        loadCodeFromLocalStorage();
    } else if (elementsExist.highlighting && elementsExist.codeEditor) {
        updateHighlighting();
    }
});
