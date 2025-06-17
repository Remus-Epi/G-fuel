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
    const pool = require('../src/utils/RenderDbConnection.js');

    pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('DB error:', err);
    } else {
        console.log('Connected at:', res.rows[0]);
    }
    });

});


