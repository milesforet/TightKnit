
function render(data){
    console.log("inside")
    var html = '<div class="display">'+
    '<div class="displaytop">'+
       ' <div class="image_name">'+
        ' <img src="default.png" alt="picture">'+
       ' </div>'+
       ' <div class="name">'+
            '<a></a><br>'+
            '<a></a>'+
        '</div>'+   
    '</div>'+
    '<div class="display-post">'+
        '<p class="p"></p>'+
    '</div>'+
    '<div class="icon-comment">'+
        '<a>Comment</a>'+
        '<a>Like</a>'+
        '<a></a>'+
    '</div>'+
    '<div class="comment-line">'+
        '<form>'+
           ' <textarea class="line"></textarea>'+
        '</form>'+
    '</div>'+
'</div>'
    $('#container').append(html);
}
$(document).ready(()=>{
    var data = [{
        "name":"Nguyen",
        "date":"sdfsdfsdf"
    }]
    $('#addComment').click(()=>{
        render(data)
    })
})
const con = require('../core/pool');