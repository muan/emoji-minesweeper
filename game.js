/* global twemoji, alert */

var Game = function (cols, rows, number_of_bombs, emojiset, twemoji) {
  this.number_of_cells = cols * rows
  this.twemoji = twemoji || false
  this.emojiset = emojiset
  this.map = document.getElementById('map')
  this.outcome = document.getElementById('outcome')
  this.cols = Number(cols)
  this.rows = Number(rows)
  this.number_of_bombs = Number(number_of_bombs)
  this.rate = number_of_bombs / this.number_of_cells
  this.numbermoji = [this.emojiset[0], '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣']

  this.init()
}

Game.prototype.init = function () {
  if (this.number_of_cells > 500) { alert('too big, go away'); return false }
  if (this.number_of_cells <= this.number_of_bombs) { alert('too many bombs, are you drunk?'); return false }
  var that = this
  this.moves = 0
  this.map.innerHTML = ''
  this.outcome.innerHTML = ''
  this.bomb_array().forEach(function (a, i) {
    var mine = that.mine(a)
    var x_cord = Math.floor((i + 1) % that.cols) || that.cols
    var y_cord = Math.ceil((i + 1) / that.cols)
    mine.classList.add('x' + x_cord, 'y' + y_cord)
    mine.neighbors = [('.x' + x_cord + '.y' + (y_cord + 1)), ('.x' + x_cord + '.y' + (y_cord - 1)),
                       ('.x' + (x_cord + 1) + '.y' + (y_cord + 1)), ('.x' + (x_cord + 1) + '.y' + (y_cord - 1)), ('.x' + (x_cord + 1) + '.y' + y_cord),
                       ('.x' + (x_cord - 1) + '.y' + (y_cord + 1)), ('.x' + (x_cord - 1) + '.y' + (y_cord - 1)), ('.x' + (x_cord - 1) + '.y' + y_cord)]

    that.map.appendChild(mine)
    if (x_cord === that.cols) that.map.appendChild(document.createElement('br'))
  })

  var cells = document.querySelectorAll('.cell')
  for (var i = 0; i < cells.length; i++) {
    var obj = cells[i]
    if (obj.isBomb) continue
    var count = 0
    Array.prototype.forEach.call(document.querySelectorAll(obj.neighbors), function (n) {
      if (n.isBomb) count++
    })
    if (count === 0) obj.isSpace = true
    obj.mine_count = count
  }

  if (this.twemoji) this.prepareTwemoji()
  this.bindEvents()
  this.startTime = new Date()
}

Game.prototype.bindEvents = function () {
  var that = this
  var cells = document.getElementsByClassName('cell')

  this.map.addEventListener('mousedown', function() {
    that.moves++
  })

  Array.prototype.forEach.call(cells, function (target) {
    // clicking on a cell and revealing cell
    target.addEventListener('click', function () {
      if (!target.isMasked || target.isFlagged) return
      if (target.isBomb && document.getElementsByClassName('unmasked').length === 0) {
        that.restart(that.twemoji)
        var targetClasses = target.className.replace('unmasked', '')
        document.getElementsByClassName(targetClasses)[0].click()
        return
      }

      target.reveal()
      if (target.isSpace) {
        var neighbors = Array.prototype.filter.call(document.querySelectorAll(target.neighbors), function (neighbor) { return neighbor.isMasked })
        Array.prototype.forEach.call(neighbors, function triggerfriends (n) { setTimeout(function () {n.click()}, 5) })
      }
      that.game()
    })

    // double clicking on a cell and opening the cell and all 8 of its neightbors
    target.addEventListener('dblclick', function () {
      if (target.isFlagged) return
      target.reveal()
      var neighbors = Array.prototype.filter.call(document.querySelectorAll(target.neighbors), function (neightbor) { return neightbor.isMasked && !neightbor.isFlagged })
      Array.prototype.forEach.call(neighbors, function triggerfriends (n) { setTimeout(function () { n.click() }, 5) })
      that.game()
    })

    // marking a cell as a potential bomb
    target.addEventListener('contextmenu', function (evt) {
      evt.preventDefault()
      if (!target.isMasked) { return }
      if (target.isFlagged) {
        target.innerHTML = that.twemoji ? twemoji.parse(that.emojiset[3]) : that.emojiset[3]
        target.isFlagged = false
      } else {
        target.innerHTML = that.twemoji ? twemoji.parse(that.emojiset[2]) : that.emojiset[2]
        target.isFlagged = true
      }
    })
  })
}

Game.prototype.game = function () {
  if (this.result) return
  var cells = document.getElementsByClassName('cell')
  var masked = Array.prototype.filter.call(cells, function (cell) {
    return cell.isMasked
  })
  var bombs = Array.prototype.filter.call(cells, function (cell) {
    return cell.isBomb && !cell.isMasked
  })

  if (bombs.length > 0) {
    Array.prototype.forEach.call(masked, function (cell) { cell.reveal() })
    this.result = 'lost'
    var seconds = (new Date() - this.startTime)/1000
    this.showMessage(seconds)
  } else if (masked.length === this.number_of_bombs) {
    Array.prototype.forEach.call(masked, function (cell) { cell.reveal() })
    this.result = 'won'
    var seconds = (new Date() - this.startTime)/1000
    this.showMessage(seconds)
  }
}

Game.prototype.restart = function (twemoji) {
  this.result = false
  this.twemoji = twemoji
  this.init()
}

Game.prototype.mine = function (bomb) {
  var that = this
  var base = document.createElement('span')
  base.className = 'cell'
  base.innerHTML = this.twemoji ? twemoji.parse(this.emojiset[3]) : this.emojiset[3]
  base.isMasked = true
  if (bomb) base.isBomb = true
  base.reveal = function () {
    var emoji = this.isBomb ? that.emojiset[1] : that.numbermoji[this.mine_count]
    this.innerHTML = that.twemoji ? twemoji.parse(emoji) : emoji
    this.isMasked = false
    this.classList.add('unmasked')
  }
  return base
}

Game.prototype.prepareTwemoji = function () {
  this.emojiset.concat(this.numbermoji).forEach(function (emoji) {
    var image = document.createElement('img')
    image.src = twemoji.parse(emoji).match(/src=\"(.+)\">/)[1]
  })
}

Game.prototype.bomb_array = function () {
  var chance = this.rate * this.number_of_cells
  var arr = []
  for (var i = 0; i < chance; i++) {
    arr.push(true)
  }
  for (var n = 0; n < (this.number_of_cells - chance); n++) {
    arr.push(false)
  }
  return this.shuffle(arr)
}

Game.prototype.shuffle = function (array) {
  var currentIndex = array.length, temporaryValue, randomIndex
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex)
    currentIndex -= 1
    temporaryValue = array[currentIndex]
    array[currentIndex] = array[randomIndex]
    array[randomIndex] = temporaryValue
  }
  return array
}

Game.prototype.showMessage = function(seconds) {
  var winner = this.result == 'won'
  var emoji = winner ? '👑': '💀'
  var cheer = winner ? 'oh yeah!' : 'oh noessss'
  var verb = winner ? 'won in ' : 'lost after '
  var bye = winner ? 'hurray!' : 'better luck next time!'
  var moves_word = this.moves == 1 ? 'move' : 'moves'
  this.outcome.innerHTML =
    emoji + '<br>' + cheer + '<br>' +
    'you ' + verb + '<span class="moves">' + this.moves + '</span> ' + moves_word + ' and ' +
    '<span class="time">' + Math.round(seconds * 100) / 100 + '</span> seconds <br>' + bye
}

// console documentation

console.log('Use: `new Game(cols, rows, bombs, [emptyemoji, bombemoji, flagemoji, starteremoji], twemojiOrNot)` to start a new game with customizations.')
console.log(' Eg: `game = new Game(10, 10, 10, ["🌱", "💥", "🚩", "◻️"], false)`')
console.log(' Or: `game = new Game(16, 16, 30, ["🐣", "💣", "🚧", "◻️"], true)`')
