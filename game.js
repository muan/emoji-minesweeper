/* global twemoji, alert, MouseEvent, game */
const numbers = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣']

var Game = function (cols, rows, number_of_bombs, set, usetwemoji) {
  this.number_of_cells = cols * rows
  this.map = document.getElementById('map')
  this.cols = Number(cols)
  this.rows = Number(rows)
  this.number_of_bombs = Number(number_of_bombs)
  this.rate = number_of_bombs / this.number_of_cells

  this.emojiset = set
  this.numbermoji = [this.emojiset[0]].concat(numbers)
  this.usetwemoji = usetwemoji || false

  this.init()
}

Game.prototype.init = function () {
  this.prepareEmoji()

  // if (this.number_of_cells > 500) { alert('too big, go away'); return false }
  if (this.number_of_cells <= this.number_of_bombs) { alert('too many bombs, are you drunk?'); return false }
  var that = this
  this.moveIt(true)
  this.map.innerHTML = ''
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
  this.resetMetadata()
  this.bindEvents()
  this.updateBombsLeft()
}

Game.prototype.bindEvents = function () {
  var that = this
  var cells = document.getElementsByClassName('cell')

  Array.prototype.forEach.call(cells, function (target) {
    // clicking on a cell and revealing cell
    target.addEventListener('click', function (evt) {
      if (!target.isMasked || target.isFlagged) return
      if (document.getElementsByClassName('unmasked').length === 0) {
        that.startTimer()

        if (target.isBomb) {
          that.restart(that.usetwemoji)
          var targetClasses = target.className.replace('unmasked', '')
          document.getElementsByClassName(targetClasses)[0].click()
          return
        }
      }
      if (evt.view) that.moveIt()

      target.reveal()
      if (target.isSpace) {
        var neighbors = Array.prototype.filter.call(document.querySelectorAll(target.neighbors), function (neighbor) { return neighbor.isMasked })
        Array.prototype.forEach.call(neighbors, function triggerfriends (n) { setTimeout(function () { n.dispatchEvent(new MouseEvent('click')) }, 5) })
      }
      that.game()
    })

    // double clicking on a cell and opening the cell and all 8 of its neightbors
    target.addEventListener('dblclick', function () {
      if (target.isFlagged) return
      that.moveIt()

      target.reveal()
      var neighbors = Array.prototype.filter.call(document.querySelectorAll(target.neighbors), function (neightbor) { return neightbor.isMasked && !neightbor.isFlagged })
      Array.prototype.forEach.call(neighbors, function triggerfriends (n) { setTimeout(function () { n.dispatchEvent(new MouseEvent('click')) }, 5) })
      that.game()
    })

    // marking a cell as a potential bomb
    target.addEventListener('contextmenu', function (evt) {
      var emoji
      evt.preventDefault()
      if (!target.isMasked) { return }
      if (target.isFlagged) {
        emoji = that.emojiset[3]
        target.isFlagged = false
      } else {
        emoji = that.emojiset[2]
        target.isFlagged = true
      }
      target.childNodes[0].remove()
      target.appendChild(emoji.cloneNode())
      that.updateBombsLeft()
    })
  })

  window.addEventListener('keydown', function (evt) {
    if (evt.key == 'r' || evt.which == 'R'.charCodeAt()) {
      that.restart(usetwemoji)
    }
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
    this.showMessage()
  } else if (masked.length === this.number_of_bombs) {
    Array.prototype.forEach.call(masked, function (cell) { cell.reveal(true) })
    this.result = 'won'
    this.showMessage()
  }
}

Game.prototype.restart = function (usetwemoji) {
  clearInterval(this.timer)
  this.result = false
  this.timer = false
  this.usetwemoji = usetwemoji
  this.init()
}

Game.prototype.resetMetadata = function () {
  document.getElementById('timer').textContent = '0.00'
  document.querySelector('.wrapper').classList.remove('won', 'lost')
  document.querySelector('.result-emoji').textContent = ''
  document.querySelector('.default-emoji').innerHTML = this.usetwemoji ? twemoji.parse('😀') : '😀'
  document.querySelector('.js-settings').innerHTML = this.usetwemoji ? twemoji.parse('🔧') : '🔧'
}

Game.prototype.startTimer = function () {
  if (this.timer) return
  this.startTime = new Date()
  this.timer = setInterval(function () {
    document.getElementById('timer').textContent = ((new Date() - game.startTime) / 1000).toFixed(2)
  }, 100)
}

Game.prototype.mine = function (bomb) {
  var that = this
  var base = document.createElement('span')
  base.className = 'cell'
  base.appendChild(this.emojiset[3].cloneNode())
  base.isMasked = true
  if (bomb) base.isBomb = true
  base.reveal = function (won) {
    var bombemoji = won ? that.emojiset[2] : that.emojiset[1]
    var emoji = base.isBomb ? bombemoji : that.numbermoji[base.mine_count]
    this.childNodes[0].remove()
    this.appendChild(emoji.cloneNode())
    this.isMasked = false
    this.classList.add('unmasked')
  }
  return base
}

Game.prototype.prepareEmoji = function () {
  var that = this
  function makeEmojiElement (emoji) {
    var ele
    if(that.usetwemoji) {
      ele = document.createElement('img')
      ele.src = twemoji.parse(emoji).match(/src=\"(.+)\">/)[1]
    } else {
      ele = document.createTextNode(emoji.alt || emoji)
    }
    return ele
  }

  this.emojiset = this.emojiset.map(makeEmojiElement)
  this.numbermoji = this.numbermoji.map(makeEmojiElement)
}

Game.prototype.bomb_array = function () {
  var chance = Math.floor(this.rate * this.number_of_cells)
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

Game.prototype.moveIt = function (zero) {
  zero ? this.moves = 0 : this.moves++
  document.getElementById('moves').textContent = this.moves
}

Game.prototype.updateBombsLeft = function () {
  var flagged = Array.prototype.filter.call(document.getElementsByClassName('cell'), function (target) { return target.isFlagged })
  document.getElementById('bombs-left').textContent = this.number_of_bombs - flagged.length
}

Game.prototype.showMessage = function () {
  clearInterval(this.timer)
  var seconds = ((new Date() - this.startTime) / 1000).toFixed(2)
  var winner = this.result === 'won'
  var emoji = winner ? '😎' : '😵'
  document.querySelector('.wrapper').classList.add(this.result)
  document.getElementById('timer').textContent = seconds
  document.getElementById('result').innerHTML = this.usetwemoji ? twemoji.parse(emoji) : emoji
}

// console documentation

console.log('Use: `new Game(cols, rows, bombs, [emptyemoji, bombemoji, flagemoji, starteremoji], twemojiOrNot)` to start a new game with customizations.')
console.log(' Eg: `game = new Game(10, 10, 10, ["🌱", "💥", "🚩", "◻️"], false)`')
console.log(' Or: `game = new Game(16, 16, 30, ["🐣", "💣", "🚧", "◻️"], true)`')
