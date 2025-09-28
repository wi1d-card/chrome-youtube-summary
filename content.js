// content.js
(function() {
  if (window.youtubeTranscriptExtensionInitialized) {
    return;
  }
  window.youtubeTranscriptExtensionInitialized = true;

  console.log('YouTube Summary: Content script loaded');

  let currentUrl = location.href;
  let transcriptData = null;

  // Wait for video to be ready
  function waitForVideoElement() {
    return new Promise((resolve) => {
      const checkForVideo = () => {
        const video = document.querySelector('video');
        if (video && video.readyState >= 1) {
          resolve(video);
        } else {
          setTimeout(checkForVideo, 100);
        }
      };
      checkForVideo();
    });
  }

  // Extract transcript using DOM method
  async function extractTranscriptFromDOM() {
    try {
      console.log('YouTube Summary: Attempting DOM transcript extraction');

      // First, try to find and click the transcript button
      const transcriptButtons = [
        '[aria-label="Show transcript"]',
        '[aria-label*="transcript"]',
        'button[aria-label*="Transcript"]'
      ];

      let transcriptButton = null;
      for (const selector of transcriptButtons) {
        transcriptButton = document.querySelector(selector);
        if (transcriptButton) break;
      }

      if (transcriptButton) {
        console.log('YouTube Summary: Found transcript button, clicking...');
        transcriptButton.click();

        // Wait for transcript panel to appear
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      // Try to extract from segments container
      const segmentsContainer = document.querySelector('#segments-container');
      if (segmentsContainer) {
        console.log('YouTube Summary: Found segments container');
        const segments = segmentsContainer.querySelectorAll('[data-text]');
        if (segments.length > 0) {
          const transcript = Array.from(segments)
            .map(segment => segment.getAttribute('data-text') || segment.textContent)
            .join(' ')
            .trim();
          return transcript;
        }

        // Fallback to text content
        const transcriptText = segmentsContainer.textContent
          .replace(/[\n\r0-9:]+/g, "")
          .replace(/\s+/g, " ")
          .trim();

        if (transcriptText.length > 50) {
          return transcriptText;
        }
      }

      return null;
    } catch (error) {
      console.error('YouTube Summary: Error extracting transcript from DOM:', error);
      return null;
    }
  }

  // Extract transcript using ytInitialPlayerResponse
  async function extractTranscriptFromPlayerResponse() {
    try {
      console.log('YouTube Summary: Attempting player response transcript extraction');

      // Inject script to access window context
      return new Promise((resolve) => {
        const script = document.createElement('script');
        script.textContent = `
          try {
            const playerResponse = window.ytInitialPlayerResponse;
            if (playerResponse && playerResponse.captions) {
              window.postMessage({
                type: 'YT_PLAYER_RESPONSE',
                data: playerResponse.captions
              }, '*');
            } else {
              window.postMessage({
                type: 'YT_PLAYER_RESPONSE',
                data: null
              }, '*');
            }
          } catch (e) {
            window.postMessage({
              type: 'YT_PLAYER_RESPONSE',
              data: null
            }, '*');
          }
        `;

        const messageHandler = (event) => {
          if (event.data.type === 'YT_PLAYER_RESPONSE') {
            window.removeEventListener('message', messageHandler);
            document.head.removeChild(script);

            const captionsData = event.data.data;
            if (captionsData && captionsData.playerCaptionsTracklistRenderer) {
              const captionTracks = captionsData.playerCaptionsTracklistRenderer.captionTracks;
              if (captionTracks && captionTracks.length > 0) {
                // For now, we'll resolve with the caption track info
                // In a full implementation, you'd need a backend to fetch the actual transcript
                resolve({ hasCaptions: true, tracks: captionTracks });
              } else {
                resolve(null);
              }
            } else {
              resolve(null);
            }
          }
        };

        window.addEventListener('message', messageHandler);
        document.head.appendChild(script);

        // Timeout after 3 seconds
        setTimeout(() => {
          window.removeEventListener('message', messageHandler);
          if (document.head.contains(script)) {
            document.head.removeChild(script);
          }
          resolve(null);
        }, 3000);
      });
    } catch (error) {
      console.error('YouTube Summary: Error extracting transcript from player response:', error);
      return null;
    }
  }

  // Main transcript extraction function
  async function extractTranscript() {
    console.log('YouTube Summary: Starting transcript extraction');

    // Wait for video to be ready
    await waitForVideoElement();

    // Try DOM method first
    let transcript = await extractTranscriptFromDOM();

    if (!transcript || transcript.length < 50) {
      console.log('YouTube Summary: DOM method failed, trying player response method');
      const playerData = await extractTranscriptFromPlayerResponse();

      if (playerData && playerData.hasCaptions) {
        transcript = 'Transcript available but requires backend processing to fetch full content.';
      }
    }

    if (transcript && transcript.length > 50) {
      transcriptData = transcript;
      console.log('YouTube Summary: Transcript extracted successfully', transcript.substring(0, 100) + '...');
      return transcript;
    } else {
      console.log('YouTube Summary: No transcript found');
      return null;
    }
  }

  // Get video title and metadata
  function getVideoMetadata() {
    const title = document.querySelector('h1.ytd-watch-metadata yt-formatted-string')?.textContent ||
                  document.querySelector('h1.title')?.textContent ||
                  document.title;

    const channel = document.querySelector('#text.ytd-channel-name a')?.textContent ||
                    document.querySelector('.ytd-channel-name a')?.textContent;

    return { title, channel, url: location.href };
  }

  // Simple markdown renderer
  function renderMarkdown(text) {
    if (!text) return '';

    let html = text
      // Split into lines for processing
      .split('\n')
      .map(line => {
        // Headers
        if (line.startsWith('### ')) return `<h3>${line.substring(4)}</h3>`;
        if (line.startsWith('## ')) return `<h2>${line.substring(3)}</h2>`;
        if (line.startsWith('# ')) return `<h1>${line.substring(2)}</h1>`;
        // Lists
        if (line.startsWith('- ')) return `<li>${line.substring(2)}</li>`;
        if (line.match(/^\d+\. /)) return `<li>${line}</li>`;
        // Empty lines
        if (line.trim() === '') return '<br>';
        // Regular paragraphs
        return `<p>${line}</p>`;
      })
      .join('\n')
      // Process inline formatting
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Wrap consecutive list items
      .replace(/(<li>.*<\/li>\n?)+/g, (match) => {
        return `<ul>${match}</ul>`;
      })
      // Clean up
      .replace(/<br>\n?<\/p>/g, '</p>')
      .replace(/<p><br>/g, '<p>')
      .replace(/\n/g, '');

    return html;
  }

  // Initialize markdown preview
  function initializeMarkdownPreview(summary) {
    const previewDiv = document.querySelector('.markdown-preview');

    if (previewDiv) {
      const renderedContent = renderMarkdown(summary);
      previewDiv.innerHTML = renderedContent;
      previewDiv.style.padding = '24px';
      previewDiv.style.flex = '1';
      previewDiv.style.overflowY = 'auto';
    }
  }


  // Show fullscreen popup
  function showSummaryPopup(summary, metadata) {
    // Remove existing popup if any
    const existingPopup = document.getElementById('youtube-summary-popup');
    if (existingPopup) {
      existingPopup.remove();
    }

    // Create popup HTML
    const popup = document.createElement('div');
    popup.id = 'youtube-summary-popup';
    popup.innerHTML = `
      <div class="popup-overlay">
        <div class="popup-content">
          <div class="popup-header">
            <div class="video-info">
              <h2>${metadata.title}</h2>
              <p class="channel">${metadata.channel || 'Unknown Channel'}</p>
            </div>
            <button class="close-btn">&times;</button>
          </div>
          <div class="popup-body">
            <div class="summary-content">
              <div class="markdown-preview"></div>
            </div>
            <div class="popup-actions">
              <button class="copy-btn">Copier</button>
              <button class="regenerate-btn">Régénérer</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Add to page
    document.body.appendChild(popup);

    // Initialize markdown preview immediately
    initializeMarkdownPreview(summary);

    // Add event listeners
    const closeBtn = popup.querySelector('.close-btn');
    const copyBtn = popup.querySelector('.copy-btn');
    const regenerateBtn = popup.querySelector('.regenerate-btn');
    const overlay = popup.querySelector('.popup-overlay');

    closeBtn.addEventListener('click', () => popup.remove());
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) popup.remove();
    });

    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(summary).then(() => {
        copyBtn.textContent = 'Copié!';
        setTimeout(() => copyBtn.textContent = 'Copier', 2000);
      });
    });

    regenerateBtn.addEventListener('click', () => {
      triggerSummary(true);
    });

    // Close on Escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        popup.remove();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
  }

  // Show loading popup
  function showLoadingPopup() {
    const popup = document.createElement('div');
    popup.id = 'youtube-summary-popup';
    popup.innerHTML = `
      <div class="popup-overlay">
        <div class="popup-content loading">
          <div class="popup-header">
            <h2>Génération du résumé...</h2>
            <button class="close-btn">&times;</button>
          </div>
          <div class="popup-body">
            <div class="loading-spinner"></div>
            <p>Extraction de la transcription et génération du résumé AI...</p>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(popup);

    const closeBtn = popup.querySelector('.close-btn');
    closeBtn.addEventListener('click', () => popup.remove());

    return popup;
  }

  // Main function to trigger summary generation
  async function triggerSummary(force = false) {
    console.log('YouTube Summary: Triggering summary generation');

    // Check if we're on a video page
    if (!location.href.includes('/watch?v=')) {
      console.log('YouTube Summary: Not on a video page');
      return;
    }

    const loadingPopup = showLoadingPopup();

    try {
      // Extract transcript if not already done or if forced
      if (!transcriptData || force) {
        transcriptData = await extractTranscript();
      }

      if (!transcriptData) {
        loadingPopup.remove();
        alert('No transcript available for this video. The video may not have captions enabled.');
        return;
      }

      // Get video metadata
      const metadata = getVideoMetadata();

      // Send to background script for AI processing
      const response = await chrome.runtime.sendMessage({
        action: 'generateSummary',
        transcript: transcriptData,
        title: metadata.title,
        channel: metadata.channel,
        url: metadata.url
      });

      loadingPopup.remove();

      if (response && response.summary) {
        showSummaryPopup(response.summary, metadata);
      } else {
        alert('Failed to generate summary. Please check your OpenAI API key configuration.');
      }

    } catch (error) {
      console.error('YouTube Summary: Error generating summary:', error);
      loadingPopup.remove();
      alert('Error generating summary: ' + error.message);
    }
  }

  // Listen for URL changes (YouTube SPA navigation)
  const observer = new MutationObserver(() => {
    if (location.href !== currentUrl) {
      currentUrl = location.href;
      transcriptData = null; // Reset transcript data for new video
      console.log('YouTube Summary: Video changed');
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'triggerSummary') {
      triggerSummary();
    }
    return true;
  });

  console.log('YouTube Summary: Content script initialized');
})();