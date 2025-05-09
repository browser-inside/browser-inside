document.addEventListener('DOMContentLoaded', () => {
    const urlInput = document.getElementById('urlInput');
    const goButton = document.getElementById('goButton');
    const contentFrame = document.getElementById('contentFrame');
    const errorMessageElement = document.getElementById('errorMessage');

    let iframeLoadTimeout;

    function displayError(message) {
        errorMessageElement.textContent = message;
        errorMessageElement.style.display = 'block';
        contentFrame.src = 'about:blank'; // Clear the iframe
    }

    function clearError() {
        errorMessageElement.textContent = '';
        errorMessageElement.style.display = 'none';
    }

    function isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    function loadUrl() {
        clearError();
        let url = urlInput.value.trim();

        if (!url) {
            displayError('Please enter a URL.');
            return;
        }

        // Prepend https:// if no protocol is specified
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }

        if (!isValidUrl(url)) {
            displayError('Invalid URL format. Please include http:// or https://');
            return;
        }

        // Clear previous timeout
        if (iframeLoadTimeout) {
            clearTimeout(iframeLoadTimeout);
        }

        contentFrame.src = 'about:blank'; // Clear previous content immediately

        // Set a timeout to detect if the iframe fails to load (e.g., due to X-Frame-Options)
        // This is a common workaround as onerror is not reliable for cross-origin iframe load failures.
        iframeLoadTimeout = setTimeout(() => {
            // Check if the iframe still has 'about:blank' or if its contentDocument is inaccessible
            // (which can happen for cross-origin restrictions even if it *starts* loading)
            // A more robust check might involve checking contentWindow.length or similar,
            // but even that can be tricky. This timeout is a pragmatic approach.
            if (contentFrame.src === 'about:blank' || !contentFrame.contentWindow || contentFrame.contentWindow.length === 0) {
                 displayError('This site cannot be loaded in an iframe due to its security settings (e.g., X-Frame-Options or Content-Security-Policy), or the URL is invalid/unreachable.');
            }
        }, 10000); // 10 seconds timeout

        contentFrame.onload = () => {
            clearTimeout(iframeLoadTimeout); // Clear timeout if loaded successfully
            clearError(); // Clear any potential race condition error message
            // Check if the loaded content is actually the intended URL and not an error page from the iframe itself
            // This check is difficult for cross-origin iframes due to security restrictions.
            // We assume if onload fires, it's likely the intended content or a page from that domain.
        };

        // Attempt to set the src
        // Note: For some blocked sites, the 'load' event might still fire with an error page,
        // or it might not fire at all, hence the timeout.
        try {
            contentFrame.src = url;
        } catch (e) {
            clearTimeout(iframeLoadTimeout);
            displayError('An error occurred while trying to load the URL. It might be blocked or invalid.');
            console.error("Error setting iframe src:", e);
        }
    }

    goButton.addEventListener('click', loadUrl);

    urlInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            loadUrl();
        }
    });
});