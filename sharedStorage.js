/***[ SharedStorage API ]**********************************************************************
 * @description: The SharedStorage api offers a storage object/namespace similar to Local-    *
 *     and sessionStorage, but instead of storing for later use it shares it's stored data    *
 *     betwean the window and it's workers.                                                   *
 * @version:   0.1.0001                                                                       *
 * @copyright: Copyright 2018  Serious Hare, All rights reserved.                             *
 * @license:   Free to use and implement as is. Don't publish a modified version without my   *
 *     writen consent.                                                                        *
 *****************************************************************************[Serious Hare]***/
(function(global){

    // Add the constant values isWindow and isWorker to identify the context that the script is running in.
    const isWindow = (global.constructor.name.match(/Window/))? true : false;
    const isWorker = (global.constructor.name.match(/Worker/))? true : false;
    
    // Api Key used to identify the messages send to and from the different workers. If this key is found, the even tlistener
    // will stop propagation of the event so all message listeners should not receive messages meant for the sharedStorage api
    // All other message events will be untouched and will propagate to the other message listeners.
    const apiKey = "sh-apis0001-7292d3c5-0eb71d00-8ed8a340";

    /***[ private class SharedStorage ]************************************************************
     * @description: This is the base SharedStorage class, used to create a sharedStorage object. *
     *     It will be prototyped by the SharedStorage for the correct context.                    *
     *****************************************************************************[Serious Hare]***/
    function SharedStorage(){

        // select the proper class for the current context.
        if(isWorker){
            this.__proto__ = new WorkerSharedStorage(this);
        }else{
            this.__proto__ = new WindowSharedStorage(this);
        }
    }
    global.SharedStorage = SharedStorage;
    global.sharedStorage = new SharedStorage();

    /***[ private class WindowSharedStorage ]******************************************************
     * @description: This class represents the SharedStorage used within the window scope.        *
     * @param base: The sharedStorage to prototype.                                               *
     *****************************************************************************[Serious Hare]***/
    function WindowSharedStorage(base){
        const workers = [];      // this will contain the workers created after this api is loaded.
        const storage = base;    // this is a permanent reference to the sharedStorage base.

        var data;                // this is the storage array for the data.
        var onready;


        /***[ private function construct ]*************************************************************
         * @description: This is the constructor for this class.                                      *
         *****************************************************************************[Serious Hare]***/
        function construct(){
            data = [];
            
            // store the original Worker constructor function
            let __Worker = window.Worker;

            // create a new constructor function to add a message listener to all workers
            function Worker(path, options){

                // create the requested worker, add the message listener, and add it to the workers list.
                let worker = new __Worker(path, options);
                worker.addEventListener("message", messageListener)
                workers.push(worker);

                return worker;
            }
            // overload the old Worker constructor function with the new one.
            window.Worker = Worker;
        }


        Object.defineProperty(this, "onready", {get:function(){return onready}, set:function(func){onready = func}});


        /***[ public function clear ]******************************************************************
         * @description: When invoked, will empty all keys out of the storage.                        *
         *****************************************************************************[Serious Hare]***/
        function clear(){
            // iterate over the items in data, and call removeItem
            for(let i in data){
                removeItem(data[i].key);
            }
        }
        this.clear = clear;


        /***[ public function getItem ]****************************************************************
         * @description: When passed a key name, will return that key's value.                        *
         * @param key: The key of the value to find.                                                  *
         *****************************************************************************[Serious Hare]***/
        function getItem(key){
            // iterate over the items in data, and return the value of the item with the given key
            for(let i in data){
                if(data[i].key == key)return data[i].value;
            }
        }
        this.getItem = getItem;


        /***[ private function index ]*****************************************************************
         * @description: Get the index for the provided key.                                          *
         * @param key: The key for which to return the index.                                         *
         *****************************************************************************[Serious Hare]***/
        function index(key){
            for(var i in data){
                if(data[i].key == key)return +i;
            }
            return -1;
        }
        
        
        /***[ public function key ]********************************************************************
         * @description: When passed a number index, this method will return the name of the key at   *
         *     index of the storage.                                                                  *
         * @param index: The index of the key to find.                                                *
         *****************************************************************************[Serious Hare]***/
        function key(index){
            if(data[index]){
                return data[index].key;
            }
            return null;
        }
        this.key = key;


        /***[ private function messageListener ]*******************************************************
         * @description: This is the listener function that will catch the messages send by the       *
         *     different workers, and delegate them to the proper function. It checks if the correct  *
         *     apiKey is present within the message data.                                             *
         * @param event: The message event data.                                                      *
         *****************************************************************************[Serious Hare]***/
        function messageListener(event){
            if(event.data.apiKey == apiKey){
                event.stopPropagation();
                switch(event.data.call){
                    default: console.log(event.data.call); break;
                    case "setItem":       setItem.apply(this, event.data.args); break;
                    case "removeItem":    setItem.apply(this, event.data.args); break;
                    case "requestUpdate": requestUpdate.apply(this); break;
                }
            }
        }


        /***[ public function removeItem ]*************************************************************
         * @description: When passed a key name, will remove that key from the storage.               *
         * @param event: The key for which to remove the data.                                        *
         *****************************************************************************[Serious Hare]***/
        function removeItem(key){
            storage[key] = undefined;
            delete storage[key];
            let i = index(key);
            data[i] = undefined;
            delete data[i];

            let call = "updateStorage";
            for(let i in workers){
                workers[i].postMessage({
                    apiKey,
                    call,
                    args: [data]
                })
            }
        }
        this.removeItem = removeItem


        /***[ private function requestUpdate ]*********************************************************
         * @description: This function sends an update message to the worker requesting for it.       *
         *****************************************************************************[Serious Hare]***/
        function requestUpdate(){
            let call = "updateStorage";
            this.postMessage({
                apiKey,
                call,
                args: [data]
            });
        }


        /***[ private function setItem ]***************************************************************
         * @description: When passed a key name and value, this function will add that key and value  *
         *     to the storage, or update that key's value if it already exists.                       *
         * @param key: The key name used to store the given value.                                    *
         * @param value: The value to store.                                                          *
         *****************************************************************************[Serious Hare]***/
        function setItem(key, value){
            storage[key] = value;

            let i = (index(key) > -1)? index(key) : data.length;
            data[i] = {key, value};

            let call = "updateStorage";
            for(let i in workers){
                workers[i].postMessage({
                    apiKey,
                    call,
                    args: [data]
                })
            }
        }
        this.setItem = setItem;

        // Call the constructor after all properties and functions are defined.
        construct.apply(this, arguments);
    }
    
    
    /***[ private class WorkerSharedStorage ]******************************************************
     * @description: This class represents the SharedStorage used within the worker scope.        *
     * @param base: the sharedStorage to prototype.                                               *
     *****************************************************************************[Serious Hare]***/
    function WorkerSharedStorage(base){
        const storage = base;

        var data;
        var onready;

        /***[ private function construct ]*************************************************************
         * @description: This is the constructor for this class.                                      *
         *****************************************************************************[Serious Hare]***/
        function construct(){
            data = [];

            // add the message listener to the worker we're in. 
            global.addEventListener("message", messageListener);

            // post a message to the window context to request the existing data
            let call = "requestUpdate";
            global.postMessage({
                apiKey,
                call,
            });
        }

        Object.defineProperty(this, "onready", {get:function(){return onready}, set:function(func){onready = func}})


        /***[ public function clear ]******************************************************************
         * @description: When invoked, will empty all keys out of the storage.                        *
         *****************************************************************************[Serious Hare]***/
        function clear(){
            // iterate over the items in data, and call removeItem
            for(let i in data) removeItem(data[i].key);
        }
        this.clear = clear;


        /***[ public function getItem ]****************************************************************
         * @description: When passed a key name, will return that key's value.                        *
         * @param key: The key of the value to find.                                                  *
         *****************************************************************************[Serious Hare]***/
        function getItem(key){
            for(var i in data){
                if(data[i].key == key) return data[i].value;
            }
        }
        this.getItem = getItem;


        /***[ private function index ]*****************************************************************
         * @description: Get the index for the provided key.                                          *
         * @param key: The key for which to return the index.                                         *
         *****************************************************************************[Serious Hare]***/
        function index(key){
            for(var i in data){
                if(data[i].key == key) return +i;
            }
            return -1;
        }
        
        
        /***[ public function key ]********************************************************************
         * @description: When passed a number index, this method will return the name of the key at   *
         *     index of the storage.                                                                  *
         * @param index: The index of the key to find.                                                *
         *****************************************************************************[Serious Hare]***/
        function key(index){
            if(data[index]) return data[index].key;
            return null;
        }
        this.key = key;


        /***[ private function messageListener ]*******************************************************
         * @description: This is the listener function that will catch the messages send by the       *
         *     different workers, and delegate them to the proper function. It checks if the correct  *
         *     apiKey is present within the message data.                                             *
         * @param event: The message event data.                                                      *
         *****************************************************************************[Serious Hare]***/
        function messageListener(event){
            if(event.data.apiKey == apiKey){
                event.stopPropagation();
                switch(event.data.call){
                    case "updateStorage": updateStorage.apply(this, event.data.args); break;
                    default: console.log(event.data.call);
                }
            }
        }


        /***[ public function removeItem ]*************************************************************
         * @description: When passed a key name, will remove that key from the storage.               *
         * @param event: The key for which to remove the data.                                        *
         *****************************************************************************[Serious Hare]***/
        function removeItem(key, doSend = false){
            storage[key] = undefined;
            delete storage[key];
            var i = index(key);
            data[i] = undefined;
            delete data[i];

            if(doSend){
                var call = "removeItem";
                global.postMessage({
                    apiKey,
                    call,
                    args: [key, true]
                })
            }
        }
        this.removeItem = function(key){
            removeItem(key, true);
        }


        /***[ private function setItem ]***************************************************************
         * @description: When passed a key name and value, this function will add that key and value  *
         *     to the storage, or update that key's value if it already exists.                       *
         * @param key: The key name used to store the given value.                                    *
         * @param value: The value to store.                                                          *
         *****************************************************************************[Serious Hare]***/
        function setItem(key, value, doSend = false){
            storage[key] = value;
            if(index(key)>-1){
                data[index(key)] = {key, value};
            }else{
                data.push({key, value});
            }
            if(doSend){
                var call = "setItem";
                global.postMessage({
                    apiKey,
                    call,
                    args: [key, value, true]
                })
            }
        }
        this.setItem = function(key, value){
            setItem(key, value, true);
        }


        /***[ private function updateStorage ]*********************************************************
         * @description: This function updates the entire storage based on de provided data array.    *
         * @param newData: The new associative data array.                                            *
         *****************************************************************************[Serious Hare]***/
        function updateStorage(newData){
            for(var i in data) delete storage[data[i].key];

            data = newData;

            for(var i in data){
                setItem(data[i].key, data[i].value, false);
            }
            if(onready){
                onready.apply(new Event("ready", {}));
                onready = undefined;
            }
        }


        // Call the constructor after all properties and functions are defined.
        construct.apply(this, arguments);
    }
}(this));
