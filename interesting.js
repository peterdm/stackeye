// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

var uidPattern = new RegExp("[0-9]+");
var uid = uidPattern.exec(document.URL);

var query = "";
var topTags = {};
var chariotRace = { 
	"python" : {
		answer_distribution: 0.5,
		avg_score_per_answer: 0.1666666
	},
	"python-2.7" : {
		answer_distribution: 0.5,
		avg_score_per_answer: 1		
	}};

function fetchTopTags(callback) {
  $.getJSON("http://api.stackexchange.com/2.0/users/"+uid+"/top-answer-tags", { site: "stackoverflow" }, callback);
};

function onText(data) {
  var total_answer_score = 0;
  var total_answer_count = $('#user-panel-answers .count').first().text();
  var query = "";

  $.each(data['items'], function(index, value) {
    total_answer_score += value['answer_score'];
  });

  $.each(data['items'], function(index, value) {
     if (index>10) return false;
     if (value['answer_score'] > 0 ) {
      topTags[value['tag_name']] = { 
		'avg_score_per_answer' : Math.round((value['answer_score']/value['answer_count'])*10)/10,
		'answer_count' : value['answer_count'],
		'answer_score' : value['answer_score'],
	    'answer_distribution' : value['answer_count']/total_answer_count, 
		'score_distribution' : value['answer_score']/total_answer_score
	  };
        
	  query += value['tag_name']+"^"+ ((value['answer_score']/total_answer_score)+1) + " ";
    }
  });

  if (query!=="") {
	searchInteresting(query, onResults);
  }
};

function searchInteresting(query, callback) {
  $.getJSON('http://localhost:8983/solr/posts/interesting', { qq: query }, callback);	
};

function onResults(data, callback) {
  var interestingDiv = $('<div/>').addClass('user-panel user-panel-left');
  var interestingList = $('<ol/>').attr('id', 'user-panel-interesting');


  interestingDiv.append(
	$('<div/>').addClass('subheader').append($('<h1/>').text('Target Questions')), 
	$('<div/>').addClass('user-panel-content').append(interestingList));

	//$('<div/>').addClass('user-panel-content').append(interestingList));
  
  $.each(data['response']['docs'], function(index, value) {
    var link = $('<a/>').addClass('question-hyperlink').css('color','#555');
    link.attr('href', 'http://stackoverflow.com/questions/'+value['QuestionId']);
    link.text(value['QuestionTitle']);
    interestingList.append($('<li/>').css('margin-bottom','10px').append(link));
  });

  interestingDiv.insertBefore('#user-panel-questions');


  // visualize tags, knowledge breakdown
  var roseDiv = $('<div/>').addClass('user-panel');
  
  var canvas = $('<canvas/>').attr({
	id: 'roseChart',
	width: 450,
	height: 300
  });

  roseDiv.append(
	$('<div/>').addClass('subheader').append($('<h1/>').text('Knowledge Transfer')), 
	$('<div/>').addClass('user-panel-content').append(canvas));

  roseDiv.insertBefore('#user-panel-questions');

  var chartData = Array(); // array of pairs [a,b] where a is the count, and b is the magnitude 
  var chartLabels = Array(); // array of labels
  var chartTooltips = Array();

  $.each(topTags, function(name, value) {
	console.log(name + ': %o', value);
	chartData.push(new Array(Math.log(value['avg_score_per_answer']*70),value['answer_count']));
	chartLabels.push(name);
	chartTooltips.push(value['answer_count']+' questions answered about <b>'+name+'</b> with an average score of '+value['avg_score_per_answer']);
  });

  var rose = new RGraph.Rose('roseChart', chartData);
  rose.Set('chart.variant', 'non-equi-angular');
  rose.Set('chart.exploded', 5);
  rose.Set('chart.ymax', 6);
  rose.Set('chart.colors.alpha', 0.75);
  rose.Set('chart.colors.sequential', true);
  rose.Set('chart.text.size', 10);
  rose.Set('chart.text.color', '#555');
  rose.Set('chart.labels', chartLabels);
  rose.Set('chart.tooltips', chartTooltips);
  rose.Set('chart.tooltips.event', 'onmouseover');
  rose.Set('chart.gutter.left', 100);
  rose.Set('chart.gutter.right', 100);
  //rose.Set('chart.labels.position', 'center');
  rose.Set('chart.labels.axes', '');
  rose.Draw();  

  // draw Rose chart
  // var rose = new RGraph.Rose('rose3', [[1,2], [3,4], [5,6] ...]);
  // rose.Set('chart.tooltips', function(index) {
  //   if() // ... setup chart
  //});
  //
  // rose.Draw();


/*
  var raceList = $('<ul/>').attr('id', 'user-panel-race');



  $.each(topTags, function(name, value) {
    var link = $('<a/>').addClass('post-tag');
    link.attr('href', '/search?q=user:'+uid+'+['+name+']');
	link.text(name + ' (' + Math.round(value['answer_distribution']*100) + '% of answers)');
	
	var pct = $('<span/>').addClass('item-multiplier item-multiplier-count')
		.text(Math.round(value['avg_score_per_answer']*100)/100 + ' avg score'); 
		
	raceList.append($('<li/>').append(link).append(pct));
  });	
*/

};

// Want to visualize top-keywords for questions-answered (broken down by keyword / pie-chart?)
// Also want to visualize top-scoring keywords for questions-answered

// Maybe pie-by-questions answered, then widen-or-narrow segment (or change color) based upon points
// Or Variable-width histogram


$(document).ready(function () {
	fetchTopTags(onText);
});




