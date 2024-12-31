// main.js

// Initialize character counter
document.getElementById("tweetText").addEventListener("input", function (e) {
    const remaining = 280 - e.target.value.length;
    const charCount = document.getElementById("charCount");
    charCount.textContent = remaining;
    charCount.className = remaining < 20
        ? "absolute bottom-5 right-3 text-sm text-red-500"
        : "absolute bottom-5 right-3 text-sm text-gray-500";
});

// Update current time
function updateCurrentTime() {
    const now = new Date();
    document.getElementById("currentTime").textContent = now.toLocaleString();
}
updateCurrentTime();
setInterval(updateCurrentTime, 1000);

// Event listener for authentication button
document.getElementById("authButton").addEventListener("click", () => {
    window.location.href = "/auth/twitter";
});

// Event listener for posting tweets
document.getElementById("postTweetButton").addEventListener("click", async () => {
    const tweetText = document.getElementById("tweetText").value;
    if (!tweetText) {
        showStatus("Please enter some text for your tweet", true);
        return;
    }
    try {
        const response = await fetch("/tweet", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ text: tweetText }),
        });
        const data = await response.json();
        if (data.success) {
            const tweetUrl = `https://twitter.com/i/web/status/${data.response.data.id}`;
            showStatus("Tweet posted successfully!", false, tweetUrl);
            document.getElementById("tweetText").value = "";
            document.getElementById("charCount").textContent = "280";
            refreshHistory();
        } else {
            showStatus(data.error || "Failed to post tweet", true);
        }
    } catch (error) {
        showStatus("Error posting tweet: " + error.message, true);
    }
});

// Function to show status messages
function showStatus(message, isError = false, tweetUrl = null) {
    const statusDiv = document.getElementById("status");
    let statusHtml = `<div class="p-4 rounded-lg ${isError ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"} mt-4">${message}</div>`;
    if (tweetUrl) {
        statusHtml += `<div class="mt-2 p-4 bg-gray-100 rounded-lg"><a href="${tweetUrl}" target="_blank" class="text-blue-500 hover:text-blue-600">${tweetUrl}</a></div>`;
    }
    statusDiv.innerHTML = statusHtml;
}

// Functions to refresh history and fetch tweets
async function refreshHistory() {
    // Logic to refresh tweet history
}
async function fetchSearchedTweets() {
    // Logic to fetch searched tweets
}
