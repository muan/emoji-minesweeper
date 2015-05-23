var Game = function (x, y, bomb_n, emojiset){
  this.cell_n = x*y
  if (this.cell_n > 500) { alert("too big, go away"); return false }
  this.emojiset = emojiset
  this.map = document.getElementById("map")
  this.map.innerHTML = ""
  this.x = x
  this.y = y
  this.bomb_n = bomb_n
  this.rate = bomb_n/this.cell_n
  this.numbermoji = [this.emojiset[0], "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣"]

  this.init()
}

Game.prototype.init = function () {
  var that = this
  this.bomb_arr().forEach(function (a, i) {
    var mine = that.mine(a)
    var x_cord = Math.floor((i+1)%that.x) || that.x
    var y_cord = Math.ceil((i+1)/that.x)
    mine.classList.add("x"+ x_cord, "y" + y_cord)
    mine.neightbors = [(".x" + x_cord + ".y" + (y_cord + 1)), (".x" + x_cord + ".y" + (y_cord - 1)),
                       (".x" + (x_cord + 1) + ".y" + (y_cord + 1)), (".x" + (x_cord + 1) + ".y" + (y_cord - 1)), (".x" + (x_cord + 1) + ".y" + y_cord),
                       (".x" + (x_cord - 1) + ".y" + (y_cord + 1)), (".x" + (x_cord - 1) + ".y" + (y_cord - 1)), (".x" + (x_cord - 1) + ".y" + y_cord)]

    that.map.appendChild(mine)
    if (x_cord === that.x) that.map.appendChild(document.createElement("br"))
  })

  var cells = document.querySelectorAll(".cell")
  for(var i=0; i < cells.length; i++) {
    var obj = cells[i]
    if (obj.bomb) { continue }
    var count = 0
    Array.prototype.forEach.call(document.querySelectorAll(obj.neightbors), function (n) {
      if (n.bomb) count ++
    })
    if (count === 0) obj.classList.add("space")
    obj.innerText = that.numbermoji[count]
  }

  this.bindEvents()
  this.customizeEmoji()
}

Game.prototype.bindEvents = function () {
  window.classes = []
  var that = this
  var cells = document.getElementsByClassName("cell")
  Array.prototype.forEach.call(cells, function (target){
    target.addEventListener("click", function() {
      if (!target.classList.contains("masked") || target.classList.contains("flagged")) return false
      target.classList.remove("masked")
      if (target.classList.contains("space")) {
        var neightbors = Array.prototype.filter.call(document.querySelectorAll(target.neightbors), function (neightbor) { return neightbor.classList.contains("masked") })
        Array.prototype.forEach.call(neightbors, function (n) { n.click() })
      }
      that.game()
    })

    target.addEventListener("contextmenu", function (evt) {
      target.classList.contains("flagged") ? target.classList.remove("flagged") : target.classList.add("flagged")
      evt.preventDefault()
    })
  })
}

Game.prototype.game = function () {
  if (this.result) return false
  var cells = document.getElementsByClassName("cell")
  var masked = document.getElementsByClassName("masked")
  var bombs = Array.prototype.filter.call(cells, function (cell) {
    return cell.bomb === true && !cell.classList.contains("masked")
  })

  if (bombs.length > 0) {
    Array.prototype.forEach.call(masked, function(cell) { cell.classList.remove("masked") })
    this.result = "lost"
    alert("you lost")
  } else if (document.getElementsByClassName("masked").length === this.bomb_n) {
    console.log(masked)
    Array.prototype.forEach.call(masked, function(cell) { cell.classList.remove("masked") })
    this.result = "won"
    alert("you won")
  }
}

Game.prototype.mine = function (bomb) {
  var base = document.createElement("span")
  base.className = "cell masked"
  if (bomb) {
    base.bomb = true
    base.innerText = this.emojiset[1]
  }
  return base
}

Game.prototype.bomb_arr = function () {
  var chance = this.rate * this.cell_n
  var arr = []
  for(var i=0; i < chance; i++) {
    arr.push(true)
  }
  for(var n=0; n < (this.cell_n - chance); n++) {
    arr.push(false)
  }
  return this.shuffle(arr)
}

Game.prototype.customizeEmoji = function () {
  var oldstyle = document.querySelector("#map style")
  if (oldstyle) oldstyle.remove()
  var style = document.createElement("style")
  style.innerText = ".cell.masked:before { content: '" + this.emojiset[3] + "'; } .masked.flagged:before { content: '" + this.emojiset[2] + "'; }"
  this.map.appendChild(style)
}

Game.prototype.shuffle = function (array) {
  var currentIndex = array.length, temporaryValue, randomIndex
  while (0 !== currentIndex) {
    randomIndex = Math.floor(Math.random() * currentIndex)
    currentIndex -= 1
    temporaryValue = array[currentIndex]
    array[currentIndex] = array[randomIndex]
    array[randomIndex] = temporaryValue
  }
  return array
}
