(() => {
    'use strict';

    // --- DOM refs ---
    const $ = (sel) => document.getElementById(sel);
    const chatArea      = $('chatArea');
    const landing       = $('landing');
    const uploadCard    = $('uploadCard');
    const fileInput     = $('fileInput');
    const uploadStatus  = $('uploadStatus');
    const queryForm     = $('queryForm');
    const questionInput = $('questionInput');
    const sendBtn       = $('sendBtn');
    const inputWrapper  = $('inputWrapper');
    const sidebarDoc    = $('sidebarDoc');
    const sidebarHistory = $('sidebarHistory');
    const sidebar       = $('sidebar');
    const sidebarToggle = $('sidebarToggle');
    const newChatBtn    = $('newChatBtn');

    let docReady = false;
    let history  = [];

    // --- Auto-resize textarea ---
    function autoResize() {
        questionInput.style.height = 'auto';
        questionInput.style.height = Math.min(questionInput.scrollHeight, 160) + 'px';
    }

    questionInput.addEventListener('input', () => {
        autoResize();
        sendBtn.disabled = !questionInput.value.trim();
    });

    // Submit on Enter (Shift+Enter for newline)
    questionInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (questionInput.value.trim()) queryForm.requestSubmit();
        }
    });

    // --- Sidebar toggle (mobile) ---
    sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });

    // Close sidebar on outside click (mobile)
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768 &&
            sidebar.classList.contains('open') &&
            !sidebar.contains(e.target) &&
            e.target !== sidebarToggle) {
            sidebar.classList.remove('open');
        }
    });

    // --- Upload: click ---
    uploadCard.addEventListener('click', () => fileInput.click());

    // --- Upload: drag & drop ---
    uploadCard.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadCard.classList.add('dragover');
    });

    uploadCard.addEventListener('dragleave', () => {
        uploadCard.classList.remove('dragover');
    });

    uploadCard.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadCard.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file && file.name.toLowerCase().endsWith('.pdf')) handleUpload(file);
    });

    fileInput.addEventListener('change', () => {
        if (fileInput.files[0]) handleUpload(fileInput.files[0]);
    });

    // --- Upload handler ---
    async function handleUpload(file) {
        uploadStatus.textContent = `Indexing "${file.name}"…`;
        uploadStatus.className = 'upload-status loading';
        uploadCard.classList.add('processing');

        const fd = new FormData();
        fd.append('file', file);

        try {
            const res = await fetch('/upload', { method: 'POST', body: fd });
            const data = await res.json();

            docReady = true;
            landing.style.animation = 'fadeIn 0.3s ease reverse forwards';
            setTimeout(() => {
                landing.remove();
                addMessage(`Document "${data.filename}" loaded. Ask me anything about it.`, 'ai');
            }, 280);

            // Update sidebar
            sidebarDoc.querySelector('.doc-label').textContent = data.filename;
            sidebarDoc.querySelector('.doc-label').classList.add('active');

            questionInput.focus();
        } catch {
            uploadStatus.textContent = 'Upload failed. Please check the server logs.';
            uploadStatus.className = 'upload-status error';
            uploadCard.classList.remove('processing');
        }
    }

    // --- Create message row ---
    function addMessage(text, role) {
        const row = document.createElement('div');
        row.className = `msg-row ${role}`;

        const inner = document.createElement('div');
        inner.className = 'msg-inner';

        const avatar = document.createElement('div');
        avatar.className = 'msg-avatar';
        avatar.textContent = role === 'user' ? 'U' : 'R';

        const content = document.createElement('div');
        content.className = 'msg-content';

        const name = document.createElement('div');
        name.className = 'msg-name';
        name.textContent = role === 'user' ? 'You' : 'LocalRAG';

        const msg = document.createElement('div');
        msg.className = 'msg-text';
        msg.textContent = text;

        content.appendChild(name);
        content.appendChild(msg);
        inner.appendChild(avatar);
        inner.appendChild(content);
        row.appendChild(inner);
        chatArea.appendChild(row);

        requestAnimationFrame(() => {
            chatArea.scrollTop = chatArea.scrollHeight;
        });

        // Add to sidebar history
        if (role === 'user') {
            history.push(text);
            renderHistory();
        }

        return row;
    }

    // --- Typing indicator ---
    function showTyping() {
        const row = document.createElement('div');
        row.className = 'msg-row ai';
        row.id = 'typingRow';
        row.innerHTML = `
            <div class="msg-inner">
                <div class="msg-avatar">R</div>
                <div class="msg-content">
                    <div class="msg-name">LocalRAG</div>
                    <div class="msg-text">
                        <span class="typing-dots"><span></span><span></span><span></span></span>
                    </div>
                </div>
            </div>`;
        chatArea.appendChild(row);
        requestAnimationFrame(() => {
            chatArea.scrollTop = chatArea.scrollHeight;
        });
    }

    function removeTyping() {
        const el = $('typingRow');
        if (el) el.remove();
    }

    // --- Sidebar history ---
    function renderHistory() {
        sidebarHistory.innerHTML = '';
        history.slice().reverse().forEach((q) => {
            const item = document.createElement('div');
            item.className = 'history-item';
            item.textContent = q;
            sidebarHistory.appendChild(item);
        });
    }

    // --- New chat ---
    newChatBtn.addEventListener('click', () => {
        if (!docReady) return;
        chatArea.querySelectorAll('.msg-row').forEach(r => r.remove());
        history = [];
        renderHistory();
        questionInput.focus();
    });

    // --- Query submit ---
    queryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const question = questionInput.value.trim();
        if (!question || !docReady) return;

        addMessage(question, 'user');
        questionInput.value = '';
        autoResize();
        sendBtn.disabled = true;
        showTyping();

        try {
            const res = await fetch('/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question }),
            });
            const data = await res.json();
            removeTyping();
            addMessage(data.answer, 'ai');
        } catch {
            removeTyping();
            addMessage('Something went wrong processing your request. Please check the server logs.', 'ai');
        } finally {
            sendBtn.disabled = !questionInput.value.trim();
            questionInput.focus();
        }
    });
})();
