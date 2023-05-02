function playVideo(src) {
	const videoPlayer = document.getElementById('video-player');
	videoPlayer.src = src;
	const videoPlayerContainer = document.querySelector('.video-player-container');
	videoPlayerContainer.style.display = 'block';
}

function closeVideo() {
	const videoPlayer = document.getElementById('video-player');
	videoPlayer.pause();
	videoPlayer.currentTime = 0;
	const videoPlayerContainer = document.querySelector('.video-player-container');
	videoPlayerContainer.style.display = 'none';
}
