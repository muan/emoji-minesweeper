/* global twemoji, alert, MouseEvent, game */
const numbers = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣']
const iDevise = navigator.platform.match(/^iP/)
const feedback = document.querySelector('.feedback')

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

  if (this.number_of_cells > 2500) { alert('too big, go away, have less than 2500 cells'); return false }
  if (this.number_of_cells <= this.number_of_bombs) { alert('more bombs than cells, can\'t do it'); return false }
  var that = this
  this.moveIt(true)
  this.map.innerHTML = ''
  var grid_data = this.bomb_array()

  function getIndex (x, y) {
    if (x > that.cols || x <= 0) return -1
    if (y > that.cols || y <= 0) return -1
    return that.cols * (y - 1 ) + x - 1
  }

  var row = document.createElement('div')
  row.setAttribute('role', 'row')
  grid_data.forEach(function (isBomb, i) {
    var cell = document.createElement('span')
    cell.setAttribute('role', 'gridcell')
    var mine = that.mine(isBomb)
    var x = Math.floor((i + 1) % that.cols) || that.cols
    var y = Math.ceil((i + 1) / that.cols)
    var neighbors_cords = [[x, y - 1], [x, y + 1], [x - 1, y - 1], [x - 1, y], [x - 1, y + 1], [x + 1, y - 1], [x + 1, y], [x + 1, y + 1]]
    if(!isBomb) {
      var neighbors = neighbors_cords.map(function (xy) { return grid_data[getIndex(xy[0], xy[1])] })
      mine.mine_count = neighbors.filter(function (neighbor_bomb) { return neighbor_bomb }).length
    }
    mine.classList.add('x' + x, 'y' + y)
    mine.neighbors = neighbors_cords.map(function (xy) { return `.x${xy[0]}.y${xy[1]}` })

    cell.appendChild(mine)
    row.appendChild(cell)
    if (x === that.cols)  {
      that.map.appendChild(row)
      row = document.createElement('div')
      row.setAttribute('role', 'row')
    }
  })

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
      that.updateFeedback(target.getAttribute('aria-label'))

      if (target.mine_count === 0 && !target.isBomb) {
        that.revealNeighbors(target)
      }
      that.game()
    })

    // double clicking on a cell and opening the cell and all 8 of its neighbors
    target.addEventListener('dblclick', function () {
      if (target.isFlagged) return
      that.moveIt()

      target.reveal()
      that.revealNeighbors(target)
      that.game()
    })

    // marking a cell as a potential bomb
    target.addEventListener('contextmenu', function (evt) {
      var emoji
      evt.preventDefault()
      if (!target.isMasked) { return }
      if (target.isFlagged) {
        target.setAttribute('aria-label','Field')
        that.updateFeedback('Unflagged as potential bomb')
        emoji = that.emojiset[3].cloneNode()
        target.isFlagged = false
      } else {
        target.setAttribute('aria-label', 'Flagged as potential bomb')
        that.updateFeedback('Flagged as potential bomb')
        emoji = that.emojiset[2].cloneNode()
        target.isFlagged = true
      }
      target.childNodes[0].remove()
      target.appendChild(emoji)
      that.updateBombsLeft()
    })

    // support to HOLD to mark bomb, works in Android by default
    if (iDevise) {
      target.addEventListener('touchstart', function (evt) {
        that.holding = setTimeout(function () {
          target.dispatchEvent(new Event('contextmenu'))
        }, 500)
      })

      target.addEventListener('touchend', function (evt) {
        clearTimeout(that.holding)
      })
    }
  })

  window.addEventListener('keydown', function (evt) {
    if (evt.key == 'r' || evt.which == 'R'.charCodeAt()) {
      that.restart(that.usetwemoji)
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
  var base = document.createElement('button')
  base.type = 'button'
  base.setAttribute('aria-label', 'Field')
  base.className = 'cell'
  base.appendChild(this.emojiset[3].cloneNode())
  base.isMasked = true
  if (bomb) base.isBomb = true
  base.reveal = function (won) {
    var emoji = base.isBomb ? (won ? that.emojiset[2] : that.emojiset[1]) : that.numbermoji[base.mine_count]
    var text = base.isBomb ? (won ? "Bomb discovered" : "Boom!") : (base.mine_count === 0 ? "Empty field" : base.mine_count + " bombs nearby")
    this.childNodes[0].remove()
    this.setAttribute('aria-label', text)
    this.appendChild(emoji.cloneNode())
    this.isMasked = false
    this.classList.add('unmasked')
  }
  return base
}

Game.prototype.revealNeighbors = function (mine) {
  var neighbors = document.querySelectorAll(mine.neighbors)
  for(var i = 0; i < neighbors.length; i++) {
    if (neighbors[i].isMasked && !neighbors[i].isFlagged) {
      neighbors[i].reveal()

      if (neighbors[i].mine_count === 0 && !neighbors[i].isBomb) {
        this.revealNeighbors(neighbors[i])
      }
    }
  }
}

Game.prototype.prepareEmoji = function () {
  var that = this
  function makeEmojiElement (emoji) {
    var ele
    if(that.usetwemoji) {
      if (emoji.src) {
        ele = emoji
      } else {
        ele = document.createElement('img')
        ele.className = 'emoji'
        ele.setAttribute('aria-hidden', 'true')
        ele.src = twemoji.parse(emoji).match(/src=\"(.+)\">/)[1]
      }
    } else {
      ele = document.createTextNode(emoji.alt || emoji.data || emoji)
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
  document.getElementById('bombs-left').textContent = `${this.number_of_bombs - flagged.length}/${this.number_of_bombs}`
}

Game.prototype.updateFeedback = function (text) {
  feedback.textContent = text
  // Toggle period to force voiceover to read out the same content
  if (this.feedbackToggle) feedback.textContent += "."
  this.feedbackToggle = !this.feedbackToggle
}

Game.prototype.showMessage = function () {
  clearInterval(this.timer)
  var seconds = ((new Date() - this.startTime) / 1000).toFixed(2)
  var winner = this.result === 'won'
  var emoji = winner ? '😎' : '😵'
  this.updateFeedback(winner ? "Yay, you won!" : "Boom! you lost.")
  document.querySelector('.wrapper').classList.add(this.result)
  document.getElementById('timer').textContent = seconds
  document.getElementById('result').innerHTML = this.usetwemoji ? twemoji.parse(emoji) : emoji
}

// console documentation

console.log('Use: `new Game(cols, rows, bombs, [emptyemoji, bombemoji, flagemoji, starteremoji], twemojiOrNot)` to start a new game with customizations.')
console.log(' Eg: `game = new Game(10, 10, 10, ["🌱", "💥", "🚩", "◻️"], false)`')
console.log(' Or: `game = new Game(16, 16, 30, ["🐣", "💣", "🚧", "◻️"], true)`')
