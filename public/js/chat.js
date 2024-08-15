const socket = io()

const $messageForm = document.getElementById('message-form')
const $messageFormInput = document.getElementById('TextInput')
const $messageFormButton = document.getElementById('sendButton')
const $messageButtonLocation = document.getElementById('shareLocation')
const $messages = document.getElementById('messages')

const messageTemplate = document.getElementById('message-template').innerHTML
const locationTemplate = document.getElementById('messageLocation-template').innerHTML
const sidebarTemplate = document.getElementById('sidebar-template').innerHTML


const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true})


const autoScroll = () => {
    $newMessage = $messages.lastElementChild
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    const visibleHeight = $messages.offsetHeight

    const containerHeight = $messages.scrollHeight

    const scrollOffset = $messages.scrollTop + visibleHeight

    if( containerHeight - newMessageHeight <=scrollOffset ) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('message', (message) => {
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('HH:mm')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

socket.on('Locationmessage', (message) => {

    const html = Mustache.render(locationTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('HH:mm')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

socket.on('roomData', ({room, users}) => {
    document.getElementById("sidebar").innerHTML = Mustache.render(sidebarTemplate, {
        room,
        users
    })
})


$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()
    $messageFormButton.setAttribute('disabled', 'disabled')

    const message = e.target.elements.message.value
    socket.emit('sendMessage', message, (error) => {
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()

        if (error) {
            return console.log(error)
        }

    })
})

$messageButtonLocation.addEventListener('click', (e) => {

    if (!navigator.geolocation) {
        return alert('Geolocation not supported')
    }
    $messageButtonLocation.setAttribute('disabled', 'disabled')
    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('shareLocation', {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            },
            () => {
                $messageButtonLocation.removeAttribute('disabled')
            })
    })
})


socket.emit('join', {username, room}, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})