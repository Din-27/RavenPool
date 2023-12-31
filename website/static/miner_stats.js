/*
Copyright 2021 JAMPS (jamps.pro)

Authors: Olaf Wasilewski (olaf.wasilewski@gmx.de)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
associated documentation files (the "Software"), to deal in the Software without restriction,
including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense,
and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial
portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT
LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

var workerHashrateData;
var workerHashrateChart;
var workerHistoryMax = 180;
var statData;
var totalHash;
var totalImmature;
var totalBal;
var totalPaid;
var totalShares;
var alerted = false;
var shareGage;
var invalidGage;
var workerGage;
var hashGage;
function getWorkerNameFromAddress(w) {
	var worker = w;
	if (w.split(".").length > 1) {
		worker = w.split(".")[1];
		if (worker == null || worker.length < 1) {
			worker = "noname";
		}
	} else {
		worker = "noname";
	}
	return worker;
}
function displayCharts() {
	var stats = getWorkerStats(_miner);
	shareGage = new JustGage({
		id: "gauge",
		value: stats.currRoundShares > 0 ? Math.floor((stats.currRoundShares / stats.currRoundPoolShares) * 100) : 0,
		min: 0,
		max: 100,
		symbol: '%',
		pointer: true,
		counter: true,
		decimals: 2,
		pointerOptions: {
			toplength: -15,
			bottomlength: 10,
			bottomwidth: 12,
			color: '#659dbd',
			stroke: '#ffffff',
			stroke_width: 3,
			stroke_linecap: 'round'
		},
		title: "Shares This Round",
		gaugeWidthScale: 0.6,
		levelColors: ["#e8e84c", "#6cdb5e"],
		levelColorsGradient: true
	});
	var tmpInt = Math.min((((10000 * stats.shares / (stats.shares + stats.invalidShares)) / 100)), 100);
	var tmpInt2 = (100 - tmpInt) || 0;
	invalidGage = new JustGage({
		id: "validShare",
		value: tmpInt2,
		min: 0,
		max: 100,
		symbol: '%',
		pointer: true,
		counter: true,
		decimals: 2,
		pointerOptions: {
			toplength: -15,
			bottomlength: 10,
			bottomwidth: 12,
			color: '#659dbd',
			stroke: '#ffffff',
			stroke_width: 3,
			stroke_linecap: 'round'
		},
		title: "Invalid Shares",
		gaugeWidthScale: 0.6,
		levelColors: ["#f9a42c", "#f21f10"],
		levelColorsGradient: true
	});
	workerGage = new JustGage({
		id: "workerDominance",
		value: stats.miners ? (Object.keys(stats.miners).length / stats.poolSize) * 100 : 0,
		min: 0,
		max: 100,
		symbol: '%',
		pointer: true,
		counter: true,
		decimals: 2,
		pointerOptions: {
			toplength: -15,
			bottomlength: 10,
			bottomwidth: 12,
			color: '#659dbd',
			stroke: '#ffffff',
			stroke_width: 3,
			stroke_linecap: 'round'
		},
		title: "Worker Dominance",
		gaugeWidthScale: 0.6,
		levelColors: ["#e8e84c", "#6cdb5e"],
		levelColorsGradient: true
	});
	var high = 0;
	console.log(stats.hashrate);
	hashGage = new JustGage({
		id: "hashDominance",
		value: stats.hashrate > 0 ? (stats.hashrate / stats.poolHashrate) * 100 : 0,
		min: 0,
		max: 100,
		symbol: '%',
		pointer: true,
		counter: true,
		decimals: 2,
		pointerOptions: {
			toplength: -15,
			bottomlength: 10,
			bottomwidth: 12,
			color: '#659dbd',
			stroke: '#ffffff',
			stroke_width: 3,
			stroke_linecap: 'round'
		},
		title: "Hashrate Dominance",
		gaugeWidthScale: 0.6,
		levelColors: ["#e8e84c", "#6cdb5e"],
		levelColorsGradient: true
	});
	var maxScale = 0;
	var label = 'H/s';
	for (var w in stats.miners) {
		var pair = getReadableHashratePair(Math.max.apply(null, stats.miners[w].hashrate.map(x => x[1])));
		var i = pair[2];
		if (maxScale < i) {
			maxScale = i;
			label = pair[1];
		}
	}
	var dataset = [];
	for (var d in stats.miners) {
		var data = stats.miners[d];
		var color = getRandomPastelColor();
		var o = {
			label: data.key,
			fill: false,
			data: data.hashrate.map(x => {
				return {
					t: x[0],
					y: getScaledHashrate(x[1], i)
				}
			}),
			borderWidth: 2,
			backgroundColor: color,
			borderColor: color
		};
		dataset.push(o);
	}
	workerHashrateChart = createDefaultLineChart(
		document.getElementById("workerHashChart").getContext('2d'),
		dataset,
		'Time',
		label
	);
}
function updateStats() {
	var stats = getWorkerStats(_miner);
	totalHash = stats.hashrate;
	totalShares = stats.totalShares;
	$("#statsHashrate").text(getReadableHashrateString(totalHash));
	$("#statsHashrateAvg").text(getReadableHashrateString(calculateAverageHashrate(null)));
	$("#statsTotalImmature").text(totalImmature);
	$("#statsTotalBal").text(totalBal);
	$("#statsTotalPaid").text(totalPaid);
	$("#statsShares").text(stats.currRoundShares > 0 ? Math.floor((stats.currRoundShares / stats.currRoundPoolShares) * 100) : 0);
	$("#statsDominance").text(stats.hashrate > 0 ? (stats.hashrate / stats.poolHashrate) * 100 : 0);
}
function updateWorkerStats() {
	var stats = getWorkerStats(_miner);
	var i = 0;
	for (var w in stats.miners) {
		i++;
		var htmlSafeWorkerName = w.split('.').join('_').replace(/[^\w\s]/gi, '');
		var saneWorkerName = getWorkerNameFromAddress(w);
		console.log(stats.miners[w]);
		$("#statsHashrate" + htmlSafeWorkerName).text(getReadableHashrateString(stats.miners[w].hashrate[stats.miners[w].hashrate.length - 1] || 0));
		$("#statsHashrateAvg" + htmlSafeWorkerName).text(getReadableHashrateString(calculateAverageHashrate(saneWorkerName)));
		$("#statsTotalImmature").text(totalImmature);
		$("#statsTotalBal").text(totalBal);
		$("#statsTotalPaid").text(totalPaid);
		$("#statsShares").text(stats.currRoundShares > 0 ? Math.floor((stats.currRoundShares / stats.currRoundPoolShares) * 100) : 0);
		$("#statsDominance").text(stats.hashrate > 0 ? (stats.hashrate / stats.poolHashrate) * 100 : 0);
	}
}
function addWorkerToDisplay(name, htmlSafeName, workerObj) {
	var htmlToAdd = "";
	htmlToAdd = '<div class="boxStats" id="boxStatsLeft" style="float:left; margin: 9px; min-width: 200px;"><div class="boxStatsList">';
	htmlToAdd += '<div class="boxLowerHeader text-white">' + name.replace(/[^\w\s]/gi, '') + '</div><div>';
	htmlToAdd += '<div><i class="fas fa-tachometer-alt"></i> <span id="statsHashrate' + htmlSafeName + '">' + getReadableHashrateString(workerObj.hashrate[workerObj.hashrate.length - 1][1] || 0) + '</span> (Now)</div>';
	htmlToAdd += '<div><i class="fas fa-tachometer-alt"></i> <span id="statsHashrateAvg' + htmlSafeName + '">' + getReadableHashrateString(calculateAverageHashrate(name)) + '</span> (Avg)</div>';
	htmlToAdd += '</div></div></div>';
	$("#boxesWorkers").html($("#boxesWorkers").html() + htmlToAdd);
}
function calculateAverageHashrate(worker) {
	var stats = getWorkerStats(_miner);
	var count = 0;
	var total = 1;
	var avg = 0;
	for (w in stats.miners) {
		count = 0;
		for (var ii = 0; ii < stats.miners[w].hashrate.length; ii++) {
			if (worker == null || stats.miners[w].key === worker) {
				count++;
				avg += parseFloat(stats.miners[w].hashrate[ii][1]);
			}
		}
		if (count > total)
			total = count;
	}
	avg = avg / total;
	return avg;
}
function rebuildWorkerDisplay() {
	var stats = getWorkerStats(_miner);
	$("#boxesWorkers").html("");
	var i = 0;
	for (var w in stats.miners) {
		i++;
		var htmlSafeWorkerName = w.split('.').join('_').replace(/[^\w\s]/gi, '');
		var saneWorkerName = getWorkerNameFromAddress(w);
		addWorkerToDisplay(saneWorkerName, htmlSafeWorkerName, stats.miners[w]);
	}
}
$.getJSON('/api/worker_stats?' + _miner, function (data) {
	if (document.hidden) return;
	$.getJSON('/api/pool_stats', function (statData) {
		addWorkerToTracker(statData, data, _miner, function () {
			var stats = getWorkerStats(_miner);
			statData = data;
			for (var w in statData.workers) {
				_workerCount++;
			}
			displayCharts();
			rebuildWorkerDisplay();
			updateStats();
			var totalPaid = statData.paid || 0;
			var totalBal = statData.balance || 0;
			var totalImmature = statData.immature || 0;
			var totalHashrate = statData.totalHash || 0;
			var totalShares = statData.totalShares || 0;
			var SYMB = stats.symbol || "coins";
			$('#total-paid-label').append(totalPaid.toFixed(8) + ' ' + SYMB);
			$('#total-immature-label').append(totalImmature.toFixed(8) + ' ' + SYMB);
			$('#total-balance-label').append(totalBal.toFixed(8) + ' ' + SYMB);
			$('#total-hashrate-label').append(getReadableHashrateString(totalHashrate));
			$('#total-shares-label').append((totalShares * 10).toFixed(2));
		});
	});
});
statsSource.addEventListener('message', function (e) {
	var stats = JSON.parse(e.data);
	$.getJSON('/api/worker_stats?' + _miner, function (data) {
	});
});