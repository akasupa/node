let $ = require('jquery')
let io = require('socket.io-client')
let socket = io('http://127.0.0.1:8000')
socket.on('connect', ()=>console.log('connected'))
let $template = $('#template')

$('body').html('Hello world!')

// ESNext in the browser!!!
 socket.on('connect', ()=>console.log('connected'))

socket.on('im', msg => {
    let $li = $template.clone().show()
    $li.children('span').text(msg)
    $('#messages').append($li)
})
$('form').submit(() => {
    socket.emit('im', $('#m').val())
    $('#m').val('')
    return false
})