const socket = io();


const gameContent = document.querySelector(".game__content");
const menuContent = document.querySelector(".menu__content");

const btn = document.createElement("button");
const btn2 = document.createElement("button");
const inputJoin = document.createElement("input");
// btn.textContent = "Create Room";
// btn2.textContent = "Join Room";
// btn.addEventListener("click", () => {

//     socket.emit("createRoom", inputJoin.value);

//     gameContent.classList.toggle('hidden');
//     menuContent.classList.toggle('hidden');
// });

// btn2.addEventListener("click", () => {
//     socket.emit("joinRoom", inputJoin.value);
//     gameContent.classList.toggle('hidden');
//     menuContent.classList.toggle('hidden');
// });

// menuContent.appendChild(btn);

// menuContent.appendChild(inputJoin);
// menuContent.appendChild(btn2);



// -------------------------

const btnPlay = document.querySelector('#playGame');
const playSection = document.querySelector('.start__content');
const menuSection = document.querySelector('.menu__content');

const playGame = () => {
    playSection.classList.toggle('hidden');
    menuSection.classList.toggle('hidden');
}
btnPlay.addEventListener("click", playGame);

const btnMode = document.querySelector('.menu__content--bloc-top');
const btnJoinOrCreate = [...btnMode.children];
btnJoinOrCreate.forEach((btn) => {
    btn.addEventListener("click", () => {
        if (btn.dataset.mode === 'join') {
            btnJoinOrCreate[1].classList.remove('active');
            showContentMenu('join')
        } else if (btn.dataset.mode === 'create') {
            btnJoinOrCreate[0].classList.remove('active');
            showContentMenu('create')
        }
        btn.classList.add('active');
    });
})

const joinContent = document.querySelector('.join__content');
const createContent = document.querySelector('.create__content');
const showContentMenu = (state) => {
    if (state === 'join') {
        joinContent.classList.remove('hidden');
        createContent.classList.add('hidden');
    } else if (state === 'create') {
        joinContent.classList.add('hidden');
        createContent.classList.remove('hidden');
    }
}

const createRoomBtn = document.querySelector('#createRoom');
createRoomBtn.addEventListener("click", () => {
    const inputCreate = document.querySelector('input[name="room_name"]');
    const inputMode = document.querySelector('input[name="bo"]:checked');
    socket.emit("createRoom", inputCreate.value, inputMode.value);
});

socket.on('roomRefresh', (rooms) => {
    const roomList = document.querySelector('ul.join__content');
    roomList.innerHTML = '';

    Object.keys(rooms, 'before No Room')
    if (Object.keys(rooms).length < 1) {
        roomList.innerHTML = '<li><p style="text-align: center; width: 100%; margin: 0;">Aucune Room</></li>';
    }

    for (const room in rooms) {
        const li = document.createElement('li');
        const pName = document.createElement('p');
        const pMode = document.createElement('p');
        const pNumber = document.createElement('p');
        pName.textContent = room;
        pNumber.textContent = rooms[room]["players"].length;
        pMode.textContent = rooms[room]["mode"];
        pNumber.textContent += '/2';
        li.dataset.room = room;
        li.addEventListener('click', () => {
            socket.emit('joinRoom', room);
        });

        li.appendChild(pName);
        li.appendChild(pMode);
        li.appendChild(pNumber);
        roomList.appendChild(li);
    }
});

const textWait = document.querySelector('.game__content--mid>h2');
const choiceContent = document.querySelector('.game__content--mid-play');
const choiceContentTurn = document.querySelector('.game__content__choice');
const textMode = document.querySelector('.player_mode');
const choicePlay = document.querySelectorAll('.choicePlay');
const playerImg = document.querySelectorAll('.player_img');
const topPlayerOne = document.querySelector('.top-player-one');
const topPlayerTwo = document.querySelector('.top-player-two');

socket.on('startGame', (room) => {
    gameContent.classList.remove('hidden');
    menuContent.classList.add('hidden');
    textWait.textContent = 'Faites votre choix !';
    choiceContent.classList.remove('hidden');
    console.dir(choiceContent)
    choicePlay.forEach((choice) => {
        choice.addEventListener('click', () => {
            socket.emit('choice', choice.dataset.choice, room);
            choiceContent.classList.add('hidden');
            choiceContentTurn.innerHTML = moveImg[choice.dataset.choice];
        })
    });
    topPlayerOne.style.visibility = 'visible';
    topPlayerTwo.style.visibility = 'visible';
    playerImg[0].src = 'assets/avatar/' + room.avatar[0] + '.png';
    playerImg[1].src = 'assets/avatar/' + room.avatar[1] + '.png';
})

socket.on('waitGame', (room) => {
    gameContent.classList.remove('hidden');
    menuContent.classList.add('hidden');
    textWait.textContent = 'En attente d\'un adversaire...';
    textMode.textContent = room.mode;
    choiceContent.classList.add('hidden');
    playerScore[0].textContent = room.score[0];
    playerScore[1].textContent = room.score[1];
    topPlayerOne.style.visibility = 'visible';
    playerImg[0].src = 'assets/avatar/' + room.avatar[0] + '.png';
})

const moveImg = {
    "paper": '<img src="assets/choice/1.png" class="choicePlay" style="margin-top: 10px;" data-choice="paper" alt="Paper">',
    "scissor": '<img src="assets/choice/2.png" class="choicePlay" style="margin-top: 10px;" data-choice="scissor" alt="Scissor">',
    "rock": '<img src="assets/choice/3.png" class="choicePlay" style="margin-top: 10px;" data-choice="rock" alt="Rock">'
}

const playerScore = document.querySelectorAll('.player_score');
socket.on('result', (room, winner) => {
    console.log(moveImg)
    console.log(room.move[0], 'in')
    choiceContentTurn.innerHTML = moveImg[room.move[0]] + moveImg[room.move[1]];

    playerScore[0].textContent = room.score[0];
    playerScore[1].textContent = room.score[1];

    const maxScore = Math.ceil(room.mode.split('')[2] / 2);
    console.log(maxScore, room.score[0], room.score[1])
    if (room.score[0] == maxScore || room.score[1] == maxScore) {
        choiceContent.classList.add('hidden');
        textWait.textContent = 'Game is over !';
        const newH2 = document.createElement('h2');
        if (room.score[0] == maxScore) {
            document.querySelector('.top-player-two').style.filter = 'grayscale(1)';
            newH2.textContent = 'Player1 Win';
        } else if (room.score[1] == maxScore) {
            document.querySelector('.top-player-one').style.filter = 'grayscale(1)';
            newH2.textContent = 'Player2 Win';
        }

        document.querySelector('.game__content--mid').insertBefore(newH2, document.querySelector('.game__content--mid').children[1]);

    } else {
        if (winner == 'draw') {
            textWait.textContent = 'Match Nul';
        } else if (winner == 'player1') {
            textWait.textContent = 'Player1 Win';
        } else if (winner == 'player2') {
            textWait.textContent = 'Player2 Win';
        }
        newTurn();
    }

});

const newTurn = () => {
    setTimeout(() => {
        textWait.textContent = 'Faites votre choix !';
        choicePlay.forEach((choice) => {
            choice.classList.remove('hidden');
        });
        choiceContent.classList.remove('hidden');
        choiceContentTurn.innerHTML = '';
    }, 4000);
}
// socket.on('joinRoom', () => {
//     gameContent.classList.toggle('hidden');
//     menuContent.classList.toggle('hidden');
//     document.body.style.backgroundColor = 'red';
// })