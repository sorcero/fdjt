/* -*- Mode: Javascript; -*- */

/* Copyright (C) 2009-2010 beingmeta, inc.
   This file is a part of the FDJT web toolkit (www.fdjt.org)
   This file provides extended Javascript utility functions
    of various kinds.

   This program comes with absolutely NO WARRANTY, including implied
   warranties of merchantability or fitness for any particular
   purpose.

    Use, modification, and redistribution of this program is permitted
    under either the GNU General Public License (GPL) Version 2 (or
    any later version) or under the GNU Lesser General Public License
    (version 3 or later).

    These licenses may be found at www.gnu.org, particularly:
      http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
      http://www.gnu.org/licenses/lgpl-3.0-standalone.html

*/

var fdjtState=
  (function(){

    function fdjtState(name,val,persist){
      if (arguments.length===1)
	return ((window.sessionStorage)&&(getSession(name)))||
	  ((window.sessionStorage)&&(getLocal(name)))||
	  getCookie(name);
      else if (persist)
	if (window.localStorage)
	  if (val) setLocal(name,val);
	  else dropLocal(name);
	else {
	  var domain=fdjtState.domain||location.hostname;
	  var path=fdjtState.path||"/";
	  var duration=fdjtState.duration||(3600*24*365*7);
	  if (val) setCookie(name,val,duration,path,domain);
	  else clearCookie(name,path,domain);}
      else if (val)
	if (window.sessionStorage) setSession(name,val);
	else setCookie(name,val);
      else if (window.sessionStorage) dropSession(name);
      else clearCookie(name);};
    fdjtState.domain=false;
    fdjtState.path=false;
    fdjtState.duration=false;

    /* Old-school cookies */

    function getCookie(name,parse){
      try {
	var cookies=document.cookie;
	var namepat=new RegExp("(^|(; ))"+name+"=");
	var pos=cookies.search(namepat);
	var valuestring;
	if (pos>=0) {
	  var start=cookies.indexOf('=',pos)+1;
	  var end=cookies.indexOf(';',start);
	  if (end>0) valuestring=cookies.slice(start,end);
	  else valuestring=cookies.slice(start);}
	else return false;
	if (parse)
	  return JSON.parse(decodeURIComponent(valuestring));
	else return decodeURIComponent(valuestring);}
      catch (ex) {
	return false;}}
    fdjtState.getCookie=getCookie;

    function setCookie(name,value,expires,path,domain){
      try {
	if (value) {
	  var valuestring=
	    ((typeof value === 'string') ? (value) :
	     (value.toJSON) ? (value.toJSON()) :
	     (value.toString) ? (value.toString()) : (value));
	  var cookietext=name+"="+encodeURIComponent(valuestring);
	  if (expires)
	    if (typeof(expires)==='string')
	      cookietext=cookietext+'; '+expires;
	    else if (expires.toGMTString)
	      cookietext=cookietext+"; expires="+expires.toGMTString();
	    else if (typeof(expires)==='number')
	      if (expires>0) {
		var now=new Date();
		now.setTime(now.getTime()+expires);
		cookietext=cookietext+"; expires="+now.toGMTString;}
	      else cookietext=cookietext+"; expires=Sun 1 Jan 2000 00:00:00 UTC";
	    else {}
	  if (path) cookietext=cookietext+"; path="+path;
	  // This certainly doesn't work generally and might not work ever
	  if (domain) cookietext=cookietext+"; domain="+domain;
	  // fdjtTrace("Setting cookie %o cookietext=%o",name,cookietext);
	  document.cookie=cookietext;}
	else fdjtClearCookie(name,path,domain);}
      catch (ex) {
	fdjtWarn("Error setting cookie %s",name);}}
    fdjtState.setCookie=setCookie;

    function clearCookie(name,path,domain){
      try {
	var valuestring="ignoreme";
	var cookietext=name+"="+encodeURIComponent(valuestring)+
	  "; expires=Sun 1 Jan 2000 00:00:00 UTC";
	if (path) cookietext=cookietext+"; path="+path;
	// This certainly doesn't work generally and might not work ever
	if (domain) cookietext=cookietext+"; domain="+domain;
	// fdjtTrace("Clearing cookie %o: text=%o",name,cookietext);
	document.cookie=cookietext;}
      catch (ex) {
	fdjtWarn("Error clearing cookie %s",name);}}
    fdjtState.clearCookie=clearCookie;

    /* Session storage */

    function setSession(name,val){
      if (window.sessionStorage)
	window.sessionStorage[name]=val;
      else fdjtSetCookie(name,val);}
    fdjtState.setSession=setSession;

    function getSession(name){
      if (window.sessionStorage)
	return window.sessionStorage[name];
      else fdjtGetCookie(name);}
    fdjtState.getSession=getSession;

    function dropSession(name){
      if (window.sessionStorage)
	return window.sessionStorage.removeItem(name);
      else fdjtClearCookie(name);}
    fdjtState.dropSession=dropSession;

    /* Local storage (persists between sessions) */

    function setLocal(name,val){
      if (window.localStorage)
	window.localStorage[name]=val;}
    fdjtState.setLocal=setLocal;

    function getLocal(name){
      if (window.localStorage)
	return window.localStorage[name];
      else return false;}
    fdjtState.getLocal=getLocal;

    function dropLocal(name){
      if (window.localStorage)
	return window.localStorage.removeItem(name);
      else return false;}
    fdjtState.dropLocal=dropLocal;
    
    /* Gets arguments from the query string */
    function getQuery(name,multiple,matchcase){
      if (!(location.search))
	if (multiple) return [];
	else return false;
      var results=[];
      var namepat=new RegExp("(&|^|\\?)"+name+"(=|&|$)",((matchcase)?"g":"gi"));
      var query=location.search;
      var start=query.search(namepat);
      while (start>=0) {
	// Skip over separator if non-initial
	if ((query[start]==='?')||(query[start]==='&')) start++;
	// Skip over the name
	var valstart=start+name.length; var end=false;
	if (query[valstart]==="=") {
	  var valstring=query.slice(valstart+1);
	  end=valstring.search(/(&|$)/g);
	  if (end<=0)
	    if (multiple) {
	      results.push(query.slice(start,valstart));
	      return results;}
	    else return query.slice(start,valstart);
	  else if (multiple)
	    results.push(valstring.slice(0,end));
	  else return valstring.slice(0,end);}
	else if (multiple)
	  results.push(query.slice(start,end));
	else return query.slice(start,end);
	if (end>0) {
	  query=query.slice(end);
	  start=query.search(namepat);}}
      if (multiple) return results; else return false;}
    fdjtState.getQuery=getQuery;

    return fdjtState;})();

/* Emacs local variables
;;;  Local variables: ***
;;;  compile-command: "make; if test -f ../makefile; then cd ..; make; fi" ***
;;;  End: ***
*/