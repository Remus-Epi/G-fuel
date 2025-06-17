document.querySelector(".play-btn").addEventListener("click", function() {
    // const playButton = document.querySelector(".play-btn");
    // playButton.animate([
    //     { transform: 'scale(1)' },
    //     { transform: 'scale(1.4)' },
    //     { transform: 'scale(1)' }
    // ], {
    //     duration: 300,
    //     easing: 'ease-in-out'
    // });
    // console.log("Play button clicked");
    document.querySelector(".play-btn").addEventListener("click", async function() {
        try {
            const response = await fetch('/api/db-query');
            const data = await response.json();
            console.log('Connected at:', data.timestamp);
        } catch (error) {
            console.error('Error:', error);
        }
    });

});


