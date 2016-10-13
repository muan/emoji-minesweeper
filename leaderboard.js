var Leaderboard = function(){
    this.scoresArr = []//array that stores the highscores
}

Leaderboard.prototype.updateScoreView = function(place, time, moves){
//function which creates new scores in the highscores view
  var node, textnode  

  node = document.createElement("p")
  node.className = "score" 
  textnode = document.createTextNode(place + ". " + "time: " + time + ", " + "moves: " + moves)
  node.appendChild(textnode)
  node.appendChild(document.createElement("br"))
  document.getElementById("scores").appendChild(node) 
}

//initializes the highscores when page loads
Leaderboard.prototype.initScores = function(){
  //if there isn't a saved leaderboard
  var node, textnode     

  node = document.getElementById("scores");
  while (node.firstChild) {
        node.removeChild(node.firstChild);
  }      
  if(!localStorage.getItem("scores")){
    //create a new leaderboard
    this.scoresArr = []

    function addScore(i, arr) {
    return function() {   
      arr.push({place: i, moves: 0, time: 0 })
      Leaderboard.prototype.updateScoreView(i, 0, 0)
     };
    }
    //creating a leaderboard with 10 scores
    for(var i = 1; i <= 10; i++ ){
      //wrapping the function with another function to avoid closure problem
      addScore(i,this.scoresArr)()
    }
    //stores the scores in the browser's localStorage
    localStorage.setItem("scores", JSON.stringify(this.scoresArr))
  }else{
    //if there's already a leaderboard retrive it
    this.scoresArr = JSON.parse(localStorage.getItem("scores"))
    for(var i = 0, length = this.scoresArr.length; i < length; i++){
      Leaderboard.prototype.updateScoreView(i + 1, this.scoresArr[i].time, this.scoresArr[i].moves)
    }
  }
}

//check if there's a new highscore
Leaderboard.prototype.checkScore = function(moves, time){
  
  var scoreTime, //time of a specific score in the array
  scoresArr = this.scoresArr, //the leaderboard array
  addFlag = false, //flag for checking if the score had been added
  time = parseFloat(time) // takes the time and turns it to float

  for(var i = 0, length = scoresArr.length; i < length; i++){

    scoreTime = scoresArr[i].time
    //if not added
    if(!addFlag){
      //if the time is 0
     if(scoreTime == 0){
       //add the score
       addFlag = true
       scoresArr.splice(i,0,{place:i+1,moves : moves, time:time})
     }else if(time <= scoreTime){
       //if the player's time is shorter than the current score replace it'
       addFlag = true
       scoresArr.splice(i,0,{place:i+1,moves : moves, time:time})
     }    
    }else{
      //if the score had been added
      scoresArr[i].place++ //change the place of each of the following scores
      if(i == length - 1){
        scoresArr.pop() //remove the last score so there are only 10 score
      }
    }
  }
  if(addFlag){
   //update the localstorage data
   localStorage.setItem("scores", JSON.stringify(this.scoresArr))//update localstorage with the new leaderboard
   //init scores arr and view
   this.initScores()
   //show new highscore message
   document.getElementById("highscore-popup").style.display = "block"
   //hide it again after 3 seconds
   setTimeout(function(){  document.getElementById("highscore-popup").style.display = "none" }, 3000);
  }
}