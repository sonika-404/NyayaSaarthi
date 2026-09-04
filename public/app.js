lucide.createIcons();

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('drawer-backdrop');

  const isClosed = sidebar.classList.contains('-translate-x-full');
  if (isClosed) {
    sidebar.classList.remove('-translate-x-full');
    backdrop.classList.remove('hidden');
  } else {
    sidebar.classList.add('-translate-x-full');
    backdrop.classList.add('hidden');
  }
}

function autoResize(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = Math.min(textarea.scrollHeight, 140) + 'px';
}

function setPrompt(text) {
  const input = document.getElementById('query-input');
  input.value = text;
  autoResize(input);

  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('drawer-backdrop');
  if (sidebar && !sidebar.classList.contains('-translate-x-full')) {
    sidebar.classList.add('-translate-x-full');
    backdrop.classList.add('hidden');
  }

  input.focus();
}

async function handleQuery(e) {
  if (e) e.preventDefault();
  const input = document.getElementById('query-input');
  const submitBtn = document.getElementById('submit-btn');
  const text = input.value.trim();

  if (!text) return;

  const chatStream = document.getElementById('chat-stream');

  // 1. User Query Brief
  const userBox = document.createElement('div');
  userBox.className = "max-w-4xl mx-auto flex justify-end";
  userBox.innerHTML = `
    <div class="bg-registry-850 border border-registry-divider px-4 py-3 sm:px-6 sm:py-4 rounded-xs text-xs sm:text-sm text-slate-200 max-w-[88%] sm:max-w-xl shadow-lg leading-relaxed break-words font-serif italic border-l-2 border-l-registry-gold">
      &ldquo;${DOMPurify.sanitize(text)}&rdquo;
    </div>
  `;
  chatStream.appendChild(userBox);
  
  input.value = '';
  input.style.height = 'auto';

  // 2. Dossier Stream Target
  const botContainer = document.createElement('div');
  botContainer.className = "max-w-4xl mx-auto";
  botContainer.innerHTML = `
    <article class="bg-registry-900 border border-registry-divider shadow-vault p-6 sm:p-9 relative rounded-xs">
      <div id="status-line" class="flex items-center justify-between pb-3 mb-4 border-b border-registry-divider text-[10px] font-mono text-slate-500">
        <span class="text-registry-gold flex items-center gap-1.5 uppercase tracking-wider">
          <i data-lucide="compass" class="w-3.5 h-3.5 animate-spin"></i> Analyzing Precedents...
        </span>
        <span id="model-tag" class="uppercase tracking-widest text-slate-500">Connecting...</span>
      </div>
      <div id="output-target" class="legal-prose"></div>
      <div class="mt-6 pt-4 border-t border-registry-divider flex items-center justify-between text-[10px] font-mono text-slate-500">
        <span>Authority: Supreme Court of India</span>
        <span>Article 141 Codex</span>
      </div>
    </article>
  `;
  chatStream.appendChild(botContainer);
  lucide.createIcons();
  chatStream.scrollTop = chatStream.scrollHeight;

  submitBtn.disabled = true;

  try {
    const response = await fetch('/api/consult/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: text })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP error ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let rawMarkdown = '';
    const outputTarget = botContainer.querySelector('#output-target');
    const modelTag = botContainer.querySelector('#model-tag');
    const statusLine = botContainer.querySelector('#status-line');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;

          try {
            const payload = JSON.parse(jsonStr);

            if (payload.type === 'meta') {
              modelTag.textContent = payload.modelUsed;
              statusLine.querySelector('span').innerHTML = `
                <i data-lucide="check-square" class="w-3.5 h-3.5 text-registry-gold"></i> Ratio Decidendi
              `;
              lucide.createIcons();
            } else if (payload.type === 'chunk') {
              rawMarkdown += payload.text;
              outputTarget.innerHTML = DOMPurify.sanitize(marked.parse(rawMarkdown));
              chatStream.scrollTop = chatStream.scrollHeight;
            } else if (payload.type === 'error') {
              outputTarget.innerHTML = `<span class="text-xs text-red-400 font-mono">${DOMPurify.sanitize(payload.error)}</span>`;
            }
          } catch (parseErr) {
            console.error('SSE JSON parse error:', parseErr, line);
          }
        }
      }
    }
  } catch (err) {
    const outputTarget = botContainer.querySelector('#output-target');
    outputTarget.innerHTML = `<span class="text-xs text-red-400 font-mono">Network error: ${DOMPurify.sanitize(err.message)}</span>`;
  } finally {
    submitBtn.disabled = false;
    lucide.createIcons();
    chatStream.scrollTop = chatStream.scrollHeight;
  }
}