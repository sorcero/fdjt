/* -*- Mode: Javascript; -*- */

/* ######################### fdjt/hatchshow.js ###################### */

/* Copyright (C) 2012-2012 beingmeta, inc.
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


 This is based on the implementation by Charlie Park described at:
    http:://charlipark.org/hatchshow/

*/

/* To do:
    modularize font size adjustment with delta
    add maxheight constraints
    handle resizing
    documentation
*/

var HatchShow={
    min_font_size: false,
    max_font_size: false,
    classes: ["hsjs"],
    onload: true,onresize: true,
    unhide: true};

(function(){

    function setupDOM(elt){
	var parent=elt.parentNode, container;
	if (parent.className==="hatchshow_temp")
	    return parent;
	var cstyle=elt.currentStyle||
	    ((window.getComputedStyle)&&
	     (window.getComputedStyle(elt,null)));
	var style=elt.style;
	if (((cstyle)&&(cstyle.display==='block'))||
	    (style.display==='block')||(elt.tagName==='div')||
	    (elt.tagName==='p')||(elt.tagName[0]==='h'))
	    container=document.createElement("div");
	else container=document.createElement("span");
	container.className='hatchshow_temp';
	parent.replaceChild(container,elt);
	container.appendChild(elt);
	container.style.display='block';
	// Set up CSS valures if needed
	if (!((cstyle)&&(cstyle.display==="inline-block"))) {
	    try {style.display="inline-block;"} catch (ex) {};
	    if (style.display!=="inline-block") style.display='inline';}
	if (!((cstyle)&&
	      ((cstyle.whiteSpace==="pre")||
	       (cstyle.whiteSpace==="nowrap"))))
	    style.whiteSpace="pre";
	var size=parseSize(((cstyle)&&(cstyle.fontSize))||
			   (style.fontSize));
	if (size) container.style.fontSize=size+"px";
	else {
	    // If you can't get the fontsize, just pick one and set it
	    //  This doesn't handle the case where the element has an explicit
	    //   font-size style of its own, which we would clobber.
	    size=12; container.style.fontSize=size+"px";}
	return container;}

    function parseSize(arg){
	// To be more clever and robust, we could handle units besides
	// pixels
	if (typeof arg === 'number') return arg;
	// In many cases, this just works
	else try { return parseInt(arg); }
	catch (ex) {}
	var len=arg.length;
	if ((len>2)&&((arg.slice(len-2))=="px")) {
	    try { return parseInt(arg.slice(0,len)); }
	    catch (ex) {return false;}}}

    function parentWidth(parent){
	var w=parent.offsetWidth;
	if (w>0) return w;
	else return ((parent.parentNode)&&
		     (parentWidth(parent.parentNode)));}

    // This is the core of the algorithm, adjusting the font size
    //  to put the inner element's size just past the outer element.
    function tweakFontSize(elt,delta,container,size,min,max){
	if (!(container)) container=setupDOM(elt);
	var parent=container.parentNode, pw=parentWidth(parent);
	if (!(size)) size=parseSize(container.style.fontSize);
	// This should hold us for a while
	if (!(max)) max=7000000; if (!(min)) min=1; 
	// This is where the real scaling happens
	var w=elt.offsetWidth, pw=parentWidth(parent);
	if (w<pw) while ((w<pw)&&(size>min)&&(size<max)) {
	    size=size+delta;
	    container.style.fontSize=(size)+"px";
	    w=elt.offsetWidth;}
	else if (w>pw) while ((w>pw)&&(size>min)&&(size<max)) {
	    size=size-delta;
	    container.style.fontSize=(size)+"px";
	    w=elt.offsetWidth;}
	else {}
	return size;}
    
    function adjust(elt,min,max,unhide){
	var container=setupDOM(elt);
	var size=parseSize(container.style.fontSize);
	if (typeof unhide === 'undefined') unhide=HatchShow.unhide;
	size=tweakFontSize(elt,10,container,size,min,max);
	size=tweakFontSize(elt,1,container,size,min,max);
	size=tweakFontSize(elt,0.1,container,size,min,max);
	var w=elt.offsetWidth, pw=parentWidth(container.parentNode);
	// If you're over, adjust it one last time to make it fit
	if (w>pw) size=tweakFontSize(elt,0.1,container,size,min,max);
	if (unhide) elt.style.visibility='visible';
	return size;}
    HatchShow.adjust=function(elt,minfont,maxfont,unhide){
	if (!(maxfont)) maxfont=HatchShow.max_font;
	if (!(minfont)) minfont=HatchShow.min_font;
	return adjust(elt,minfont,maxfont,unhide);}
    
    // This handles getting the elements to adjust
    function getElements(elt){
	var results=[];
	var classes=HatchShow.classes;
	if (classes.length===0) return [];
	if (!(elt)) elt=document.body;
	if (elt.getElementsByClassName) {
	    if (classes.length===1)
		return elt.getElementsByClassName(classes[0]);
	    else {
		var j=0, jlim=classes.length;
		while (j<jlim) {
		    var classname=classes[j++];
		    results=results.concat(
			elt.getElementsByClassName(classname));}
		return results;}}
	else if (elt.querySelectorAll) {
	    var spec="."+(classes.join(", '"));
	    return elt.querySelectorAll(spec);}
	else if (window.$) {
	    var spec="."+(classes.join(", '"));
	    return window.$(spec);}
	else {
	    var regex_string=
		((classes.length===1)?("\\b"+classes[0]+"\\b"):
		 ("(\\b"+classes.join("\\b)|(\\b")+"\\b)"));
	    var regex=new RegExp(regex_string);
	    if (elt.children) {
		var children=elt.children;
		var i=0, lim=children.length;
		while (i<lim) {
		    var node=children[i++];
		    if ((node.nodeType===1)&&(node.className)&&
			(node.className.search(regex)>=0))
			results.push(node);}
		return results;}
	    else {
		slowZoneSearch(elt,regex,results);
		return results;}}}

    function slowZoneSearch(elt,regex,results){
	if (elt.nodeType!==1) return;
	if ((elt.className)&&(node.className.search(regex)>=0))
	    results.push(node);
	var children=elt.childNodes;
	var i=0, lim=children.length;
	while (i<lim) {
	    var child=children[i++];
	    if (child.nodeType===1) slowZoneSearch(child,regex,results);}}
    
    function setup(elt){
	if (!(elt)) elt=document.body;
	var elts=getElements(elt);
	var min_font=HatchShow.min_font, max_font=HatchShow.max_font;
	var i=0, lim=elts.length;
	while (i<lim) adjust(elts[i++],min_font,max_font);}

    function onload(evt){
	if (HatchShow.onload) setup(document.body);}
    function onresize(evt){
	if (HatchShow.onresize) setup(document.body);}

    if (window.addEventListener) {
	window.addEventListener("load",onload);
	window.addEventListener("resize",onresize);}
    else if (window.attachEvent) {
	window.attachEvent("onload",onload);
	window.attachEvent("onload",onresize);}
    else {}})();