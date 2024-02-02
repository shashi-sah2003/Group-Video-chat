const APP_ID = "cb9776af83e04764b4805d295c1a5c83"
const TOKEN = "007eJxTYDiWH/jwvUurg9qbIr/FLh6fRLadOnKu+KpN4X35gI3HHusrMCQnWZqbmyWmWRinGpiYm5kkmVgYmKYYWZomGyaaJlsYKx7dndoQyMhgc9KOmZEBAkF8LoayzJTUfIXkjMQSBgYAkccixw=="
const CHANNEL = "video chat"

const client = AgoraRTC.createClient({mode:'rtc', codec:'vp8'})


let localTracks = [] //local Tracks (microphone and camera)
let remoteUsers = {} //remote users in the session


//Function to join the stream and display local video
let joinAndDisplayLocalStream = async () => {

    //Event-listeners for user joining and leaving
    client.on('user-published', handleUserJoined)
    client.on('user-left', handleUserLeft)
    
    //Join the channel and get a Unique UID
    let UID = await client.join(APP_ID, CHANNEL, TOKEN, null)

    //Create local microphone and camera tracks
    localTracks = await AgoraRTC.createMicrophoneAndCameraTracks() 

    //Insert local video player into the DOM
    let player = `<div class="video-container" id="user-container-${UID}">
                        <div class="video-player" id="user-${UID}"></div>
                  </div>`
                 
    document.getElementById('video-streams').insertAdjacentHTML('beforeend', player)

    //Play local video on the created player
    localTracks[1].play(`user-${UID}`)
    
    //Publish local tracks to the channel
    await client.publish([localTracks[0], localTracks[1]])

}


//Function to join the streams
let joinStream = async () => {
    await joinAndDisplayLocalStream()
    document.getElementById('join-btn').style.display = 'none'
    document.getElementById('stream-controls').style.display = 'flex'
}


// Function to handle when a user joins with video or audio
let handleUserJoined = async (user, mediaType) => {
    remoteUsers[user.uid] = user 
    
    // Subscribe to the remote user's stream
    await client.subscribe(user, mediaType)

    if (mediaType === 'video'){
        // Handle video stream
        // Remove existing player if any
        let player = document.getElementById(`user-container-${user.uid}`)
        if (player != null){
            player.remove()
        }

        // Insert new video player for the remote user
        player = `<div class="video-container" id="user-container-${user.uid}">
                        <div class="video-player" id="user-${user.uid}"></div> 
                 </div>`
        document.getElementById('video-streams').insertAdjacentHTML('beforeend', player)
        
        // Play the remote user's video on the new player
        user.videoTrack.play(`user-${user.uid}`)
    }

    if (mediaType === 'audio'){
        // Handle audio stream
        user.audioTrack.play()
    }
}


// Function to handle when a user leaves the stream
let handleUserLeft = async (user) => {
    delete remoteUsers[user.uid]
    document.getElementById(`user-container-${user.uid}`).remove()
}

// Function to leave the stream and remove local tracks
let leaveAndRemoveLocalStream = async () => {
    for(let i = 0; localTracks.length > i; i++){
        localTracks[i].stop()
        localTracks[i].close()
    }

    // Leave the channel
    await client.leave()

    // Display join button and hide controls
    document.getElementById('join-btn').style.display = 'block'
    document.getElementById('stream-controls').style.display = 'none'

    // Clear video streams container
    document.getElementById('video-streams').innerHTML = ''
}

// Function to toggle microphone state
let toggleMic = async (e) => {
    if (localTracks[0].muted){
        await localTracks[0].setMuted(false)
        e.target.innerText = 'Mic on'
        e.target.style.backgroundColor = 'cadetblue'
    }else{
        await localTracks[0].setMuted(true)
        e.target.innerText = 'Mic off'
        e.target.style.backgroundColor = '#EE4B2B'
    }
}


// Function to toggle camera state
let toggleCamera = async (e) => {
    if(localTracks[1].muted){
        await localTracks[1].setMuted(false)
        e.target.innerText = 'Camera on'
        e.target.style.backgroundColor = 'cadetblue'
    }else{
        await localTracks[1].setMuted(true)
        e.target.innerText = 'Camera off'
        e.target.style.backgroundColor = '#EE4B2B'
    }
}



// Event listeners for button clicks
document.getElementById('join-btn').addEventListener('click', joinStream)
document.getElementById('leave-btn').addEventListener('click', leaveAndRemoveLocalStream)
document.getElementById('mic-btn').addEventListener('click', toggleMic)
document.getElementById('camera-btn').addEventListener('click', toggleCamera)
