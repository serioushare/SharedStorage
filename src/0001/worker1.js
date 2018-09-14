
importScripts("sharedStorage.js");

sharedStorage.onready = function(){
    sharedStorage.setItem("worker1", "data");
    console.log(sharedStorage);
}
