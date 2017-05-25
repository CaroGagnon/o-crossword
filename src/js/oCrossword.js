/**
 * Initialises an o-crossword components inside the element passed as the first parameter
 *
 * @param {(HTMLElement|string)} [el=document.body] - Element where to search for the o-crossword component. You can pass an HTMLElement or a selector string
 * @returns {OCrossword} - A single OCrossword instance
 */

const debounce = require('o-viewport/src/utils').debounce;
const crosswordParser = require('./crossword_parser');

function prevAll(node) {
	const nodes = Array.from(node.parentNode.children);
	const pos = nodes.indexOf(node);
	return nodes.slice(0, pos);
};

function getCousins(element, type, num, direction, offset){

	if(type === 'clue'){

		const gridInput = document.body.querySelector('[data-o-crossword-number="' + num + '"]');

		let TD;

		if(direction === 'across'){
			const TDs = gridInput.parentNode.querySelectorAll('td');
			let answerStartOffset = 0;
			let count = 0;

			for(let idx = 0; idx < TDs.length; idx += 1){
				const td = TDs[idx];

				if(td === gridInput){
					answerStartOffset = idx;
				}

				if(count === offset){
					TD = td;
					break
				} else {
					count += 1;
				}

			}

		} else if(direction === 'down'){

			const acrossOffset = Array.from(gridInput.parentNode.querySelectorAll('td'))
				.map( (td, idx) => {
					return td === gridInput ? idx : false;
				})
				.filter(result => {
					return result !== false;
				})[0]
			;

			const columnStart = Number( gridInput.parentNode.getAttribute('data-tr-index') );

			TD = Array.from(document.querySelectorAll('table tr'))
				.filter( (el, idx) => {
					return idx >= columnStart;
				})
				.map(row => {
					return row.querySelector(`td:nth-child(${acrossOffset + 1})`);
				})[offset]
			;

		}

		return {
			'td' : TD
		};

	}

	if(type === 'grid'){

	}

	if(type === 'navigation'){

	}

	return null;

}

function writeErrorsAsClues(rootEl, json) {
	const cluesEl = rootEl.querySelector('ul.o-crossword-clues');

	const explain = document.createElement('li');
	explain.textContent = "Sorry, we failed to understand the details of this crossword for the following reason(s):";

	const errorsList = document.createElement('ul');
	json.errors.forEach(e => {
		const eLine = document.createElement('li');
		eLine.textContent = e;
		errorsList.appendChild(eLine);
	});

	const textLine = document.createElement('li');
	textLine.textContent = "Based on the following spec:";

	const textList = document.createElement('ul');
	json.text.split("\n").forEach( line => {
		const eLine = document.createElement('li');
		eLine.textContent = line;
		textList.appendChild(eLine);
	});

	cluesEl.appendChild(explain);
	cluesEl.appendChild(errorsList);
	cluesEl.appendChild(textLine);
	cluesEl.appendChild(textList);
}

function buildGrid(
	rootEl,
{
	size,
	name,
	gridnums,
	grid,
	clues,
	answers
}) {
	const gridEl = rootEl.querySelector('table');
	const cluesEl = rootEl.querySelector('ul.o-crossword-clues');
	const {cols, rows} = size;
	const emptyCell = rootEl.querySelector('.empty-fallback');

	for (let i=0; i<rows; i++) {
		const tr = document.createElement('tr');
		tr.setAttribute('data-tr-index', i);
		for (let j=0; j<cols; j++) {
			const td = document.createElement('td');

			tr.appendChild(td);
			if (gridnums[i][j]) {
				td.dataset.oCrosswordNumber = gridnums[i][j];
			}
			if (grid[i][j] === '.') {
				td.classList.add('empty');
				const emptyMarker = emptyCell.cloneNode(true);
				emptyMarker.classList.remove('hidden');
				td.appendChild(emptyMarker);
			}
		}
		gridEl.appendChild(tr);
	}

	rootEl.parentElement.setAttribute('data-o-crossword-title', name);

	if (clues) {
		rootEl.parentElement.setAttribute('data-o-crossword-clue-length', clues.across.length + clues.down.length);

		const acrossEl = document.createElement('ul');
		acrossEl.classList.add('o-crossword-clues-across');

		const downEl = document.createElement('ul');
		downEl.classList.add('o-crossword-clues-down');

		const acrossWrapper = document.createElement('li');
		const downWrapper = document.createElement('li');

		acrossWrapper.appendChild(acrossEl);
		cluesEl.appendChild(acrossWrapper);

		downWrapper.appendChild(downEl);
		cluesEl.appendChild(downWrapper);

		clues.across.forEach(function acrossForEach(across, index) {
			const tempLi = document.createElement('li');
			const tempSpan = document.createElement('span');
			const tempPartial = document.createElement('div');
			tempPartial.classList.add('o-crossword-user-answer');

			const answerLength = across[2].filter(isFinite).filter(isFinite).reduce((a,b)=>a+b,0);
			tempSpan.textContent = across[0] + '. ' + across[1];
			tempLi.dataset.oCrosswordNumber = across[0];
			tempLi.dataset.oCrosswordAnswerLength = answerLength;
			tempLi.dataset.oCrosswordDirection = 'across';
			tempLi.dataset.oCrosswordClueId = index;

			for(var i = 0; i < answerLength; ++i) {
				let tempInput = document.createElement('span');
				tempInput.dataset.offset = i;
				tempInput.cousins = getCousins(this, 'clue', across[0], 'across', Number( tempInput.dataset.offset ));

				tempInput.addEventListener('click', function(){

					console.log(this.cousins);

					document.querySelectorAll('span[data-active="true"]').forEach(span => {
						span.dataset.active = 'false';
					});
					tempInput.dataset.active = 'true';

				}, false);

				let count = 0;

				if(across[3].length > 1) {
					for(var j = 0; j < across[3].length; ++j) {
						if(j%2 === 1) {
							count += parseInt(across[3][j-1]);
							let separator = document.createElement('span');
							separator.classList.add('separator');

							if(across[3][j] === '-') {
								separator.innerHTML = '&mdash;';
							} else {
								separator.innerHTML = '&nbsp;';
							}

							if(i === count) {
								tempPartial.appendChild(separator);
							}
						}
					}
				}

				tempPartial.appendChild(tempInput);
			}

			acrossEl.appendChild(tempLi);
			tempLi.appendChild(tempSpan);
			tempLi.appendChild(tempPartial);
		});

		clues.down.forEach(function acrossForEach(down, index) {
			const tempLi = document.createElement('li');
			const tempSpan = document.createElement('span');
			const tempPartial = document.createElement('div');
			tempPartial.classList.add('o-crossword-user-answer');

			const answerLength = down[2].filter(isFinite).filter(isFinite).reduce((a,b)=>a+b,0);
			tempSpan.textContent = down[0] + '. ' + down[1];
			tempLi.dataset.oCrosswordNumber = down[0];
			tempLi.dataset.oCrosswordAnswerLength = answerLength;
			tempLi.dataset.oCrosswordDirection = 'down';
			tempLi.dataset.oCrosswordClueId = clues.across.length + index;

			for(var i = 0; i < answerLength; ++i) {
				let tempInput = document.createElement('span');
				tempInput.dataset.offset = i;
				tempInput.cousins = getCousins(this, 'clue', down[0], 'down', Number( tempInput.dataset.offset ));

				tempInput.addEventListener('click', function(){

					console.log(this.cousins);

					document.querySelectorAll('span[data-active="true"]').forEach(span => {
						span.dataset.active = 'false';
					});
					tempInput.dataset.active = 'true';

				}, false);
				
				let count = 0;

				if(down[3].length > 1) {
					for(var j = 0; j < down[3].length; ++j) {
						if(j%2 === 1) {
							count += parseInt(down[3][j-1]);
							let separator = document.createElement('span');
							separator.classList.add('separator');

							if(down[3][j] === '-') {
								separator.innerHTML = '&mdash;';
							} else {
								separator.innerHTML = '&nbsp;';
							}

							if(i === count) {
								tempPartial.appendChild(separator);
							}
						}
					}
				}

				tempPartial.appendChild(tempInput);
			}

			downEl.appendChild(tempLi);
			tempLi.appendChild(tempSpan);
			tempLi.appendChild(tempPartial);
		});
	}

	if (answers) {
		clues.across.forEach(function acrossForEach(across, i) {
			const answer = answers.across[i];
			const answerLength = answer.length;
			getGridCellsByNumber(gridEl, across[0], 'across', answerLength);
			getGridCellsByNumber(gridEl, across[0], 'across', answerLength).forEach((td, i) => {
				td.textContent = answer[i];
			});
		});

		clues.down.forEach(function downForEach(down, i) {
			const answer = answers.down[i];
			const answerLength = answer.length;
			getGridCellsByNumber(gridEl, down[0], 'down', answerLength).forEach((td, i) => {
				td.textContent = answer[i];
			});
		});
	}
}

function getRelativeCenter(e, el) {
	const bb = el.getBoundingClientRect();
	e.relativeCenter = {
		x: e.center.x - bb.left,
		y: e.center.y - bb.top,
	};
}

function OCrossword(rootEl) {
	if (!rootEl) {
		rootEl = document.body;
	} else if (!(rootEl instanceof HTMLElement)) {
		rootEl = document.querySelector(rootEl);
	}
	if (rootEl.getAttribute('data-o-component') === 'o-crossword') {
		this.rootEl = rootEl;
	} else {
		this.rootEl = rootEl.querySelector('[data-o-component~="o-crossword"]');
	}

	if (this.rootEl !== undefined) {
		if (this.rootEl.dataset.oCrosswordData) {
			/*
				get and parse the crossword data
				- fetch data via url or get from attribute
				- parse, generate data struct
				- render
			*/
			let p = new Promise( (resolve) => {
				if (this.rootEl.dataset.oCrosswordData.startsWith('http')) {
					return fetch(this.rootEl.dataset.oCrosswordData)
								 .then(res => res.text())
								 ;
				} else { // assume this is json text
					resolve( this.rootEl.dataset.oCrosswordData );
				}
			})
			.then(text => crosswordParser(text) )
			.then(specText => JSON.parse(specText) )
			.then( json => {
				if (json.errors){
					console.log(`Found Errors after invoking crosswordParser:\n${json.errors.join("\n")}` );
					writeErrorsAsClues(rootEl, json);
					return Promise.reject("Failed to parse crossword data, so cannot generate crossword display");
				} else {
					return json;
				}
			})
			.then(json => buildGrid(rootEl, json))
			.then(()	 => this.assemble() )
			.catch( reason => console.log("Error caught in OCrossword: ", reason ) )
			;
		}
	}
}

function getGridCellsByNumber(gridEl, number, direction, length) {
	const out = [];
	let el = gridEl.querySelector(`td[data-o-crossword-number="${number}"]`);
	if (el) {
		if (direction === 'across') {
			while (length--) {
				out.push(el);
				if (length === 0) break;
				el = el.nextElementSibling;
				if (!el) break;
			}
		}
		else if (direction === 'down') {
			const index = prevAll(el).length;
			while (length--) {
				out.push(el);
				if (length === 0) break;
				if (!el.parentNode.nextElementSibling) break;
				el = el.parentNode.nextElementSibling.children[index];
				if (!el) break;
			}
		}
	}
	return out;
}

function getLetterIndex(gridEl, cell, number, direction) {
	let el = gridEl.querySelector(`td[data-o-crossword-number="${number}"]`);

	if(direction === 'across') {
		return cell.cellIndex - el.cellIndex;
	} else {
		return parseInt(cell.parentNode.getAttribute('data-tr-index')) - parseInt(el.parentNode.getAttribute('data-tr-index'));
	}
}

OCrossword.prototype.assemble = function assemble() {
	const gridEl = this.rootEl.querySelector('table');
	const cluesEl = this.rootEl.querySelector('ul.o-crossword-clues');
	const gridMap = new Map();
	let currentlySelectedGridItem = null;
	for (const el of cluesEl.querySelectorAll('[data-o-crossword-number]')) {
		const els = getGridCellsByNumber(gridEl, el.dataset.oCrosswordNumber,el.dataset.oCrosswordDirection, el.dataset.oCrosswordAnswerLength);
		els.forEach(cell => {
			const arr = gridMap.get(cell) || [];
			arr.push({
				number: el.dataset.oCrosswordNumber,
				direction: el.dataset.oCrosswordDirection,
				answerLength: el.dataset.oCrosswordAnswerLength,
				answerPos: getLetterIndex(gridEl, cell, el.dataset.oCrosswordNumber, el.dataset.oCrosswordDirection)
			});
			gridMap.set(cell, arr);
		});
	}

	if (cluesEl) {
		let currentClue = -1;

		const cluesUlEls = Array.from(cluesEl.querySelectorAll('ul'));

		const gridWrapper = document.createElement('div');
		gridWrapper.classList.add('o-crossword-grid-wrapper');
		this.rootEl.insertBefore(gridWrapper, gridEl);

		const gridScaleWrapper = document.createElement('div');
		gridScaleWrapper.classList.add('o-crossword-grid-scale-wrapper');
		gridWrapper.appendChild(gridScaleWrapper);
		gridScaleWrapper.appendChild(gridEl);

		const clueDisplayer = document.createElement('div');
		clueDisplayer.classList.add('o-crossword-clue-displayer');
		gridScaleWrapper.appendChild(clueDisplayer);

		const clueDisplayerText = document.createElement('span');
		clueDisplayer.appendChild(clueDisplayerText);

		const clueNavigation = document.createElement('nav');
		clueNavigation.classList.add('o-crossword-clue-navigation');
		// clueNavigation.classList.add('hidden');

		const clueNavigationPrev = document.createElement('a');
		clueNavigationPrev.classList.add('o-crossword-clue-nav-prev');
		clueNavigationPrev.setAttribute('href', '#');
		clueNavigationPrev.textContent = 'Previous';
		clueNavigation.appendChild(clueNavigationPrev);

		const clueNavigationNext = document.createElement('a');
		clueNavigationNext.classList.add('o-crossword-clue-nav-next');
		clueNavigationNext.setAttribute('href', '#');
		clueNavigationNext.textContent = 'Next';
		clueNavigation.appendChild(clueNavigationNext);

		clueDisplayer.appendChild(clueNavigation);

		const wrapper = document.createElement('div');
		wrapper.classList.add('o-crossword-clues-wrapper');
		this.rootEl.insertBefore(wrapper, cluesEl);
		wrapper.appendChild(cluesEl);

		const magicInput = document.createElement('input');
		gridScaleWrapper.appendChild(magicInput);
		magicInput.classList.add('o-crossword-magic-input');

		magicInput.type = 'text';
		magicInput.style.display = 'none';

		const onResize = function onResize(init) {
			var isMobile = false;
			const cellSizeMax = 40;

			if (window.innerWidth <= 739) {
				isMobile = true;
			} else if (window.innerWidth > window.innerHeight && window.innerHeight <=739 ) { //rotated phones and small devices, but not iOS
				isMobile = true;
			}

			if(isMobile && !!init) {
				clueNavigationNext.click();
			}

			const d1 = cluesEl.getBoundingClientRect();
			let d2 = gridEl.getBoundingClientRect();
			const width1 = d1.width;
			const height1 = d1.height;
			const height2 = d2.height;

			let scale = height2/height1;
			if (scale > 0.2) scale = 0.2;

			this._cluesElHeight = height1;
			this._cluesElWidth = width1 * scale;
			this._height = height1 * scale;
			this._scale = scale;

			magicInput.style.display = 'none';

			//update grid size to fill 100% on mobile view
			const fullWidth = Math.min(window.innerHeight, window.innerWidth);
			this.rootEl.width = fullWidth + 'px !important';
			const gridTDs = gridEl.querySelectorAll('td');
			const gridSize = gridEl.querySelectorAll('tr').length;
			const newTdWidth = parseInt(fullWidth / (gridSize + 1) );
			const inputEl = document.querySelector('.o-crossword-magic-input');

			if(isMobile) {
				for (let i = 0; i < gridTDs.length; i++) {
					let td = gridTDs[i];
					td.style.width = Math.min(newTdWidth, cellSizeMax) + "px";
					td.style.height = Math.min(newTdWidth, cellSizeMax) + "px";
					td.style.maxWidth = "initial";
					td.style.minWidth = "initial";
				}

				inputEl.style.width = Math.min(newTdWidth, cellSizeMax) + "px";
				inputEl.style.height = Math.min(newTdWidth, cellSizeMax) + "px";
				inputEl.style.maxWidth = "initial";
			} else {
				for (let i = 0; i < gridTDs.length; i++) {
					let td = gridTDs[i];
					td.style.removeProperty('width');
					td.style.removeProperty('height');
					td.style.removeProperty('max-width');
					td.style.removeProperty('min-width');
				}

				let desktopSize = gridTDs[0].getBoundingClientRect().width;
				inputEl.style.width = desktopSize + "px";
				inputEl.style.height = desktopSize + "px";
			}

			d2 = gridEl.getBoundingClientRect();
			clueDisplayer.style.width = d2.width + 'px';

		}.bind(this);

		if(!isAndroid()) {
			this.onResize = debounce(onResize, 100);
		}

		onResize(true);
		window.addEventListener('resize', onResize);
	}

	if(isiOS()) {
		document.getElementsByTagName('body')[0].className += " iOS";
	}
};

OCrossword.prototype.destroy = function destroy() {
	this.removeAllEventListeners();

	if (this._raf) {
		cancelAnimationFrame(this._raf);
	}
};

module.exports = OCrossword;

function isiOS() {
	var iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
	return iOS;
}

function isAndroid() {
	var android = navigator.userAgent.toLowerCase().indexOf("android") > -1;
	return android;
}