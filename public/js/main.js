// Time display functionality
function updateCurrentTime() {
    const now = new Date();
    document.getElementById("currentTime").textContent = now.toLocaleString();
}

// Character counter for tweet input
function initCharCounter() {
    document.getElementById("tweetText").addEventListener("input", function(e) {
        const remaining = 280 - e.target.value.length;
        const charCount = document.getElementById("charCount");
        charCount.textContent = remaining;
        charCount.className = remaining < 20 
            ? "absolute bottom-5 right-3 text-sm text-red-500"
            : "absolute bottom-5 right-3 text-sm text-gray-500";
    });
}

// Format date helper
function formatDate(dateString) {
    const options = {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    };
    return new Date(dateString).toLocaleDateString("en-US", options);
}

// Authentication and status
async function checkAuthStatus() {
    try {
        const response = await fetch("/auth/status");
        const data = await response.json();
        showAuthStatus(
            data.authenticated,
            data.authenticated ? "Authenticated with Twitter" : "Not authenticated with Twitter"
        );
        updateUserInfo(data);
    } catch (error) {
        showAuthStatus(false, "Unable to check authentication status");
    }
}

function updateUserInfo(data) {
    const userInfoDiv = document.getElementById("userInfo");
    const refreshButton = document.getElementById("refreshButton");
    
    if (data.authenticated && data.user) {
        userInfoDiv.classList.remove("hidden");
        userInfoDiv.innerHTML = `
            <div class="bg-blue-50 p-4 rounded-lg">
                <div class="font-medium text-blue-700">Logged in as: @${data.user.screen_name}</div>
                <div class="text-sm text-blue-600">Twitter ID: ${data.user.id}</div>
                ${data.user.screen_name === 'lifebalance' ? 
                    '<div class="mt-2 flex gap-2"><a href="https://github.com/kgashok/PlumConfusedOpensource/issues" class="text-sm text-blue-500 hover:text-blue-600 transition-colors">Feedback</a>' +
                    '<a href="https://github.com/kgashok/PlumConfusedOpensource/issues/new" class="text-sm text-green-500 hover:text-green-600 transition-colors">New Issue</a></div>' : 
                    '<a href="https://github.com/kgashok/PlumConfusedOpensource/issues" class="mt-2 block text-sm text-blue-500 hover:text-blue-600 transition-colors">Feedback</a>'}
            </div>`;
            
        // Enable refresh button only for lifebalance
        if (data.user.screen_name === 'lifebalance') {
            refreshButton.disabled = false;
            refreshButton.classList.remove('opacity-50', 'cursor-not-allowed');
        } else {
            refreshButton.disabled = true;
            refreshButton.classList.add('opacity-50', 'cursor-not-allowed');
        }
    } else {
        userInfoDiv.classList.add("hidden");
        refreshButton.disabled = true;
        refreshButton.classList.add('opacity-50', 'cursor-not-allowed');
    }
}

// Keep track of error messages
const errorMessages = [];
const MAX_ERROR_HISTORY = 5;

function showAuthStatus(isAuthenticated, message) {
    const authStatus = document.getElementById("authStatus");
    
    if (!isAuthenticated) {
        // Add new error to history
        errorMessages.unshift({
            message,
            timestamp: new Date()
        });
        // Keep only the latest MAX_ERROR_HISTORY errors
        if (errorMessages.length > MAX_ERROR_HISTORY) {
            errorMessages.pop();
        }
    }

    authStatus.className = `mb-6 p-4 rounded-lg ${isAuthenticated ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`;
    
    if (isAuthenticated) {
        authStatus.innerHTML = `
            <div class="flex items-center">
                <span class="mr-2">✓</span>
                <span>${message}</span>
            </div>`;
    } else {
        authStatus.innerHTML = `
            <div>
                ${errorMessages.map((error, index) => `
                    <div class="flex items-center ${index > 0 ? 'mt-2 pt-2 border-t border-red-200' : ''}">
                        <span class="mr-2">✗</span>
                        <div>
                            <span>${error.message}</span>
                            <div class="text-xs text-red-500">${formatDate(error.timestamp)}</div>
                        </div>
                    </div>
                `).join('')}
            </div>`;
    }
    authStatus.classList.remove("hidden");
}

// Tweet functionality
async function refreshHistory() {
    try {
        const response = await fetch("/tweet/history");
        const history = await response.json();
        updateTweetHistory(history);
    } catch (error) {
        console.error("Error fetching tweet history:", error);
    }
}

function updateTweetHistory(history) {
    const historyDiv = document.getElementById("tweetHistory");
    if (history.length === 0) {
        historyDiv.innerHTML = getEmptyHistoryHTML();
        return;
    }
    historyDiv.innerHTML = history.map(tweet => getTweetHTML(tweet)).join("");
}

function getEmptyHistoryHTML() {
    return `
        <div class="text-gray-500 text-center py-8">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <div class="text-lg font-medium">No tweets posted yet</div>
            <div class="text-sm text-gray-400">Your tweet history will appear here</div>
        </div>`;
}

async function deleteTweet(tweetId) {
    try {
        const response = await fetch(`/tweet/${tweetId}`, {
            method: 'DELETE'
        });
        const data = await response.json();
        if (data.success) {
            const tweetElement = document.querySelector(`[data-tweet-id="${tweetId}"]`);
            if (tweetElement) {
                tweetElement.classList.add('bg-red-50');
                const messageDiv = document.createElement('div');
                messageDiv.className = 'text-red-600 text-sm mt-2';
                messageDiv.textContent = 'Tweet deleted';
                tweetElement.appendChild(messageDiv);
                setTimeout(refreshHistory, 1500);
            }
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        console.error("Error deleting tweet:", error);
    }
}

function getTweetHTML(tweet) {
    const currentUser = document.querySelector('#userInfo')?.textContent?.match(/@(\w+)/)?.[1];
    const isCurrentUser = currentUser === tweet.screen_name;
    
    return `
        <div data-tweet-id="${tweet.id}" class="border rounded-lg p-4 hover:bg-gray-50 transition duration-150 ease-in-out ${tweet.deleted ? 'bg-red-50' : ''}">
            <div class="flex justify-between items-start mb-2">
                <div>
                    <div class="text-sm ${isCurrentUser ? 'text-green-600' : 'text-blue-600'} mb-1 font-medium">
                        @${tweet.screen_name} ${isCurrentUser ? '(you)' : ''}
                    </div>
                    <div class="text-gray-700">${tweet.text}</div>
                </div>
                <div class="flex flex-col items-end gap-2">
                    <div class="text-xs text-gray-500">${formatDate(tweet.timestamp)}</div>
                    <button onclick="deleteTweet('${tweet.id}')" class="text-red-500 hover:text-red-600 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </div>
            <div class="text-sm mt-2">
                <a href="${tweet.url}" target="_blank" class="text-blue-500 hover:text-blue-600 break-all transition duration-150 ease-in-out">${tweet.url}</a>
            </div>
            <div class="text-xs text-gray-500 mt-2">Tweet ID: ${tweet.id}</div>
        </div>`;
}

// Search functionality
async function fetchSearchedTweets() {
    try {
        const response = await fetch("/search/tweets");
        const data = await response.json();
        updateSearchedTweets(data);
    } catch (error) {
        showSearchError();
    }
}

function updateSearchedTweets(data) {
    const tweetsDiv = document.getElementById("searchedTweets");
    if (data.error) {
        tweetsDiv.innerHTML = getErrorHTML(data);
        return;
    }
    if (!data.data || data.data.length === 0) {
        tweetsDiv.innerHTML = `<div class="text-gray-500 text-center py-8"><p>No tweets found.</p></div>`;
        return;
    }
    tweetsDiv.innerHTML = data.data.map(tweet => getSearchTweetHTML(tweet)).join("");
}

function getErrorHTML(data) {
    let errorMessage = data.error;
    if (data.statusCode === 429) {
        const minutes = Math.ceil(data.waitSeconds / 60);
        errorMessage = `Rate limit exceeded. Please try again in ${minutes} minute${minutes > 1 ? "s" : ""}.`;
    }
    return `
        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
            <div class="flex items-center">
                <svg class="h-5 w-5 text-red-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p class="text-red-700">${errorMessage}</p>
            </div>
        </div>`;
}

// Tweet posting functionality
async function postTweet() {
    const tweetText = document.getElementById("tweetText").value.trim();
    if (!tweetText) return;

    try {
        localStorage.setItem('draftTweet', tweetText);
        const response = await fetch("/tweet", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ text: tweetText })
        });

        const data = await response.json();
        if (data.success) {
            localStorage.removeItem('draftTweet');
            document.getElementById("tweetText").value = "";
            document.getElementById("charCount").textContent = "280";
            refreshHistory();
        } else if (data.error === 'Not authenticated. Please authorize first.') {
            window.location.href = "/auth/twitter";
            return;
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        console.error("Error posting tweet:", error);
        showAuthStatus(false, error.message || "Error posting tweet");
    }
}

// Info modal functionality
async function toggleInfo() {
    const modal = document.getElementById('infoModal');
    const body = document.body;
    
    if (modal.classList.contains('hidden')) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        body.style.overflow = 'hidden'; // Prevent background scrolling
        
        // Set focus to modal content
        const modalContent = document.getElementById('infoContent');
        modalContent.tabIndex = -1;
        modalContent.focus();
        
        // Fetch and render markdown content
        if (!modal.hasContent) {
            try {
                const response = await fetch('/docs/about');
                const content = await response.text();
                document.getElementById('infoContent').innerHTML = content;
                modal.hasContent = true;
            } catch (error) {
                console.error('Error loading info content:', error);
            }
        }
    } else {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        body.style.overflow = ''; // Restore scrolling
    }
}

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    const modal = document.getElementById('infoModal');
    if (e.target === modal) {
        toggleInfo();
    }
});

// Initialize
document.addEventListener("DOMContentLoaded", () => {
    initCharCounter();
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);
    checkAuthStatus();
    refreshHistory();
    
    // Restore draft tweet if exists
    const draftTweet = localStorage.getItem('draftTweet');
    if (draftTweet) {
        document.getElementById("tweetText").value = draftTweet;
        document.getElementById("charCount").textContent = 280 - draftTweet.length;
    }

    // Check URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has("success")) {
        showAuthStatus(true, "Successfully authenticated with Twitter!");
    } else if (urlParams.has("error")) {
        const error = decodeURIComponent(urlParams.get("error"));
        showAuthStatus(false, error);
        // Prevent the status from being overridden
        clearTimeout(window.authCheckTimeout);
    }
});

// Logout functionality
async function logout() {
    try {
        const response = await fetch('/auth/logout', {
            method: 'POST',
        });
        if (response.ok) {
            window.location.href = '/';
        }
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// Export functions needed by HTML
window.startAuth = () => window.location.href = "/auth/twitter";
window.postTweet = postTweet;
window.refreshHistory = refreshHistory;
window.fetchSearchedTweets = fetchSearchedTweets;
window.deleteTweet = deleteTweet;
window.logout = logout;

// Inspiration modal functionality
async function toggleInspiration() {
    const modal = document.getElementById('inspirationModal');
    const body = document.body;
    const content = modal.querySelector('.prose');
    
    if (modal.classList.contains('hidden')) {
        // Reset modal content
        document.getElementById('promptSection')?.classList.add('hidden');
        document.getElementById('responseSection')?.classList.add('hidden');
        
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        body.style.overflow = 'hidden';
        
        try {
            content.innerHTML = '<p>Loading dates...</p>';
            const dates = await fetchUNDates();
            
            content.innerHTML = `
                <h2>Looking for Tweet Ideas?</h2>
                <p>Here are the upcoming International Days:</p>
                <ul>
                    ${dates.map(date => `
                        <li><strong>${date.displayDate}</strong> - ${date.title}</li>
                    `).join('')}
                </ul>
                <p class="text-sm text-gray-500 mt-4">Share your thoughts about these important observances!</p>
            `;
        } catch (error) {
            content.innerHTML = '<p>Error loading dates. Please try again later.</p>';
        }
    } else {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        body.style.overflow = '';
        // Clean up modal content
        content.innerHTML = '';
    }
}
window.toggleInspiration = toggleInspiration;

// ChatGPT functionality
async function askChatGPT() {
    const modal = document.getElementById('inspirationModal');
    const body = document.body;
    
    // Reset modal state
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    body.style.overflow = 'hidden';
    
    const currentMonth = new Date().toLocaleString('en-US', { month: 'long' });
    const prompt = `Act as my international day theme expert. Take the month from today's date (${currentMonth}) and find the closest International Days that are environmentally oriented during the current month.`;
    
    const content = modal.querySelector('.prose');
    content.innerHTML = `
        <div id="promptSection">
            <h2>ChatGPT Prompt</h2>
            <div class="bg-gray-50 p-4 rounded-lg mb-4">
                <p id="gptPrompt" class="text-gray-800">${prompt}</p>
            </div>
            <button onclick="sendToChatGPT()" class="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded mb-4">
                Send to ChatGPT
            </button>
        </div>
        <div id="responseSection" class="hidden">
            <h3 class="mt-4">ChatGPT Response</h3>
            <div class="bg-green-50 p-4 rounded-lg relative">
                <p id="gptResponse" class="text-green-800"></p>
                <button onclick="copyResponse()" class="absolute top-2 right-2 text-green-600 hover:text-green-700">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"></path>
                        <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z"></path>
                    </svg>
                </button>
            </div>
        </div>`;
}

async function sendToChatGPT() {
    try {
        const promptSection = document.getElementById('promptSection');
        const responseSection = document.getElementById('responseSection');
        const gptResponse = document.getElementById('gptResponse');
        
        responseSection.classList.remove('hidden');
        gptResponse.innerHTML = 'Loading response from ChatGPT...';
        
        const response = await fetch('/api/chatgpt', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        
        if (data.success) {
            gptResponse.textContent = data.response;
        } else {
            const errorMessage = data.error === 'API quota exceeded. Please check the API key configuration.' 
                ? 'OpenAI API quota has been exceeded. Please try again later when the quota resets.'
                : data.error;
            gptResponse.innerHTML = `<div class="text-red-600">${errorMessage}</div>`;
        }
    } catch (error) {
        gptResponse.innerHTML = `<div class="text-red-600">Failed to get ChatGPT response: ${error.message}</div>`;
    }
}

function copyResponse() {
    const responseText = document.getElementById('gptResponse').textContent;
    navigator.clipboard.writeText(responseText).then(() => {
        // Visual feedback could be added here
        console.log('Response copied to clipboard');
    });
}
window.askChatGPT = askChatGPT;

// Close inspiration modal when clicking outside
document.addEventListener('click', (e) => {
    const modal = document.getElementById('inspirationModal');
    if (e.target === modal) {
        toggleInspiration();
    }
});