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
  var total_answer_count = $('.user-panel-answers .count').text();
  var query = "";

  $.each(data['items'], function(index, value) {
    total_answer_score += value['answer_score'];
  });

  $.each(data['items'], function(index, value) {
    if (value['answer_score'] > 0 ) {
      topTags[value['tag_name']] = { 
		'avg_score_per_answer' : value['answer_score']/value['answer_count'],
		'answer_count' : value['answer_count'],
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

  // visualize tags
  var raceDiv = $('<div/>').addClass('user-panel');
  var raceList = $('<ul/>').attr('id', 'user-panel-race');

  raceDiv.append(
	$('<div/>').addClass('subheader').append($('<h1/>').text('Knowledge Utility per Topic')), 
	$('<div/>').addClass('user-panel-content').append(raceList));


  $.each(topTags, function(name, value) {
    var link = $('<a/>').addClass('post-tag');
    link.attr('href', '/search?q=user:'+uid+'+['+name+']');
	link.text(name + ' (' + Math.round(value['answer_distribution']*100) + '% of answers)');
	
	var pct = $('<span/>').addClass('item-multiplier item-multiplier-count')
		.text(Math.round(value['avg_score_per_answer']*100)/100 + ' avg score'); 
		
	raceList.append($('<li/>').append(link).append(pct));
  });	
  
  raceDiv.insertBefore('#user-panel-questions');

};

// Want to visualize top-keywords for questions-answered (broken down by keyword / pie-chart?)
// Also want to visualize top-scoring keywords for questions-answered

// Maybe pie-by-questions answered, then widen-or-narrow segment (or change color) based upon points
// Or Variable-width histogram


$(document).ready(function () {
	fetchTopTags(onText);
});




