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

var fdjtUI=
  {CoHi: {classname: "cohi"},AutoPrompt: {}, InputHelp: {}, Expansion: {}};

/* Co-highlighting */
/* When the mouse moves over a named element, the 'cohi' class is added to
   all elements with the same name. */
(function(){
    var highlights={};
    function highlight(namearg,classname_arg){
	var classname=((classname_arg) || (fdjtUI.CoHi.classname));
	var newname=(namearg.name)||(namearg);
	var cur=highlights[classname];
	if (cur===newname) return;
	if (cur) {
	    var drop=document.getElementsByName(cur);
	    var i=0, n=drop.length;
	    while (i<n) fdjtDOM.dropClass(drop[i++],classname);}
	highlights[classname]=newname||false;
	if (newname) {
	    var elts=document.getElementsByName(newname);
	    var n=elts.length, i=0;
	    while (i<n) fdjtDOM.addClass(elts[i++],classname);}}
    
    fdjtUI.CoHi.onmouseover=function(evt,classname_arg){
	var target=fdjtDOM.T(evt);
	while (target)
	    if ((target.tagName==='INPUT') || (target.tagName==='TEXTAREA') ||
		((target.tagName==='A') && (target.href)))
		return;
	else if (target.name) break;  
	else target=target.parentNode;
	if (!(target)) return;
	highlight(target.name,classname_arg);};
    fdjtUI.CoHi.onmouseout=function(evt,classname_arg){
	var target=fdjtDOM.T(evt);
	highlight(false,((classname_arg) || (fdjtUI.CoHi.classname)));};
})();

/* CheckSpans:
   Text regions which include a checkbox where clicking toggles the checkbox. */
(function(){
    function CheckSpan(spec,varname,val,checked){
	var input=fdjtDOM.Input('input[type=checkbox]',varname,val);
	var span=fdjtDOM(spec||"span.checkspan",input);
	if (checked) {
	    input.checked=true;
	    fdjtDOM.addClass(span,"ischecked");}
	else input.checked=false;
	return span;}
    fdjtUI.CheckSpan=CheckSpan;

    function checkspan_onclick(evt) {
	evt=evt||event;
	target=evt.target||evt.srcTarget;
	var checkspan=fdjtDOM.getParent(target,".checkspan");
	if ((target.tagName==='INPUT')&&(target.type=='checkbox')) {
	    target.blur();
	    if (target.checked) fdjtDOM.addClass(checkspan,"checked");
	    else fdjtDOM.dropClass(checkspan,"checked");}
	else {
	    var inputs=fdjtDOM.getChildren
	    (checkspan,function(elt){
		return (elt.nodeType===1)&&
		    (elt.tagName==='INPUT')&&
		    (elt.type==='checkbox');});
	    var input=((inputs)&&(inputs.length)&&(inputs[0]));
	    if (input) 
		if (input.checked) {
		    fdjtDOM.dropClass(checkspan,"ischecked");
		    input.checked=false; input.blur();}
	    else {
		fdjtDOM.addClass(checkspan,"ischecked");
		input.checked=true; input.blur();}
	    else fdjtDOM.toggleClass(checkspan,"ischecked");}}
    fdjtUI.CheckSpan.onclick=checkspan_onclick;

    function checkspan_set(checkspan,checked){
	var inputs=fdjtDOM.getChildren
	(checkspan,function(node){
	    return (node.tagName==='INPUT')&&(node.type==='checkbox');});
	var input=((inputs)&&(inputs.length)&&(inputs[0]));
	if (checked) {
	    input.checked=true; fdjtDOM.addClass(checkspan,"ischecked");}
	else {
	    input.checked=false; fdjtDOM.dropClass(checkspan,"ischecked");}}
    fdjtUI.CheckSpan.set=checkspan_set;})();

(function(){

    function show_help_onfocus(evt){
	var target=fdjtDOM.T(evt);
	while (target)
	    if ((target.nodeType==1) &&
		((target.tagName === 'INPUT') || (target.tagName === 'TEXTAREA')) &&
		(target.getAttribute('HELPTEXT'))) {
		var helptext=fdjtID(target.getAttribute('HELPTEXT'));
		if (helptext) fdjtDOM.addClass(helptext,"showhelp");
		return;}
	else target=target.parentNode;}
    function autoprompt_onfocus(evt){
	evt=evt||event||null;
	var elt=fdjtDOM.T(evt);
	if ((elt) && (fdjtDOM.hasClass(elt,'isempty'))) {
	    elt.value='';
	    fdjtDOM.dropClass(elt,'isempty');}
	show_help_onfocus(evt);}

    function hide_help_onblur(evt){
	var target=fdjtDOM.T(evt);
	while (target)
	    if ((target.nodeType==1) &&
		((target.tagName === 'INPUT') || (target.tagName === 'TEXTAREA')) &&
		(target.getAttribute('HELPTEXT'))) {
		var helptext=fdjtID(target.getAttribute('HELPTEXT'));
		if (helptext) fdjtDOM.dropClass(helptext,"showhelp");
		return;}
	else target=target.parentNode;}
    function autoprompt_onblur(evt){
	var elt=fdjtDOM.T(evt);
	if (elt.value==='') {
	    fdjtDOM.addClass(elt,'isempty');
	    var prompt=(elt.prompt)||(elt.getAttribute('prompt'))||(elt.title);
	    if (prompt) elt.value=prompt;}
	else fdjtDOM.dropClass(elt,'isempty');
	hide_help_onblur(evt);}
    
    // Removes autoprompt text from empty fields
    function autoprompt_cleanup(form) {
	var elements=fdjtDOM.getChildren(form,".isempty");
	if (elements) {
	    var i=0; var lim=elements.length;
	    while (i<elements.length) elements[i++].value="";}}
    function autoprompt_onsubmit(evt) {
	var form=fdjtDOM.T(evt);
	autoprompt_cleanup(form);}

    // Adds autoprompt handlers to autoprompt classes
    function autoprompt_setup(arg) {
	var forms=fdjtDOM.getChildren(arg||document.body,"FORM");
	var i=0; var lim=forms.length;
	while (i<lim) {
	    var form=forms[i++];
	    var inputs=fdjtDOM.getChildren(form,"INPUT.autoprompt");
	    if (inputs.length) {
		var j=0; var jlim=inputs.length;
		while (j<jlim) {
		    var input=inputs[j++];
		    input.blur();
		    if (fdjtString.isEmpty(input.value)) {
			fdjtDOM.addClass(input,"isempty");
			var prompt=(input.prompt)||
			    (input.getAttribute('prompt'))||(input.title);
			if (prompt) input.value=prompt;}
		    fdjtDOM.addListener(input,"focus",autoprompt_onfocus);
		    fdjtDOM.addListener(input,"blur",autoprompt_onblur);}
		fdjtDOM.addListener(form,"submit",autoprompt_onsubmit);}}}
    
    fdjtUI.AutoPrompt.setup=autoprompt_setup;
    fdjtUI.AutoPrompt.onfocus=autoprompt_onfocus;
    fdjtUI.AutoPrompt.onblur=autoprompt_onblur;
    fdjtUI.AutoPrompt.onsubmit=autoprompt_onsubmit;
    fdjtUI.AutoPrompt.cleanup=autoprompt_cleanup;
    fdjtUI.InputHelp.onfocus=show_help_onfocus;
    fdjtUI.InputHelp.onblur=hide_help_onblur;})();


(function(){
    var serial=0;

    function Completions(dom,input,options) {
	this.dom=dom||false; this.input=input||false;
	this.options=options||default_options;
	this.nodes=[]; this.values=[]; this.serial=++serial;
	this.cues=[]; this.displayed=[];
	this.prefixtree={strings: []};
	this.bykey={}; this.byvalue=new fdjtKB.Map();
	if (!(options&FDJT_COMPLETE_MATCHCASE)) this.stringmap={};
	this.initialized=false;
	return this;}
    Completions.probe=function(arg){
	if (arg.tagName==='INPUT') {
	    var cid=arg.getAttribute('COMPLETIONS');
	    arg=fdjtID(cid);
	    if (arg) completions.get(arg);
	    else return false;}
	else return completions.get(arg);};

    function getKey(node){
	return node.key||(node.getAttribute("key"))||(node.value)||
	    (node.getAttribute("value"))||
	    ((fdjtDOM.hasClass(node,"variation"))&&(fdjtDOM.textify(node)))||
	    ((fdjtDOM.hasClass(node,"completion"))&&(completionText(node,"")));}
    Completions.getKey=getKey;
    function completionText(node,sofar){
	if (fdjtDOM.hasClass(node,"variation")) return sofar;
	else if (node.nodeType===3) return sofar+node.nodeValue;
	else if ((node.nodeType===1)&&(node.childNodes)) {
	    var children=node.childNodes;
	    var i=0; var lim=children.length;
	    while (i<lim) {
		var child=children[i++];
		if (child.nodeType===3) sofar=sofar+child.nodeValue;
		else if (child.nodeType===1)
		    sofar=completionText(child,sofar);
		else {}}
	    return sofar;}
	else return sofar;}

    function getValue(node){
	if (!(fdjtDOM.hasClass(node,"completions")))
	    node=fdjtDOM.getParent(node,".completions");
	var completions=((node)&&(Completions.probe(node)));
	if (completions)
	    return completions.getValue(node);
	else return false;}
    Completions.getValue=getValue;

    function addNodeKey(node,keystring,ptree,bykey,anywhere){
	var keys=((anywhere)?(keystring.split(/\W/g)):[]).concat(keystring);
	var i=0; var lim=keys.length;
	while (i<lim) {
	    var key=keys[i++];
	    fdjtString.prefixAdd(ptree,key,0);
	    if ((bykey[key])&&(bykey.hasOwnProperty(key)))
		bykey[key].push(node);
	    else bykey[key]=new Array(node);
	    bykey._count++;}}

    function getNodes(string,ptree,bykey,matchcase){
	var result=[]; var direct=[]; var variations=[];
	var keystring=stdspace(string);
	if (fdjtString.isEmpty(keystring)) return [];
	if (!(matchcase)) keystring=string.toLowerCase();
	var strings=fdjtString.prefixFind(ptree,keystring,0);
	var prefix=false;
	var i=0; var lim=strings.length;
	while (i<lim) {
	    var string=strings[i++];
	    if (prefix) prefix=fdjtString.commonPrefix(prefix,string);
	    else prefix=string;
	    var completions=bykey[string];
	    if (completions) {
		var j=0; var jlim=completions.length;
		while (j<jlim) {
		    var c=completions[j++];
		    if (fdjtDOM.hasClass(c,"completion")) {
			result.push(c); direct.push(c);}
		    else {
			var head=fdjtDOM.getParent(c,".completion");
			if (head) {
			    result.push(head); variations.push(c);}}}}}
	result.prefix=prefix;
	result.matches=direct.concat(variations);
	return result;}

    function addCompletion(c,completion,key,value) {
	if (!(key)) key=completion.key||getKey(completion);
	if (!(value))
	    value=(completion.value)||(completion.getAttribute('value'))||key;
	var pos=fdjtKB.position(c.nodes,completion);
	if (pos<0) {
	    c.nodes.push(completion); c.values.push(value);}
	else return;
	var opts=c.options;
	var container=c.dom;
	var ptree=c.prefixtree;
	var bykey=c.bykey;
	var smap=c.stringmap;
	var stdkey=stdspace(key);
	var matchcase=(opts&FDJT_COMPLETE_MATCHCASE);
	var anyword=(opts&FDJT_COMPLETE_ANYWORD);
	if (!(matchcase)) {
	    var lower=stdkey.toLowerCase();
	    smap[lower]=stdkey;
	    stdkey=lower;}
	if (!(fdjtDOM.hasParent(completion,container)))
	    fdjtDOM.append(container,completion);
	addNodeKey(completion,stdkey,ptree,bykey,anyword);
	if (fdjtDOM.hasClass(completion,"cue")) c.cues.push(completion);
	var variations=fdjtDOM.getChildren(completion,".variation");
	var i=0; var lim=variations.length;
	while (i<lim) {
	    var variation=variations[i++];
	    var vkey=stdspace(variation.key||getKey(variation));
	    addNodeKey(variation,vkey,ptree,bykey,anyword);}}

    function initCompletions(c){
	var completions=fdjtDOM.getChildren(c.dom,".completion");
	var i=0; var lim=completions.length;
	while (i<lim) addCompletion(c,completions[i++]);
	c.initialized=true;}

    Completions.prototype.addCompletion=function(completion) {
	if (!(this.initialized)) initCompletions(this);
	addCompletion(this,completion);};

    function updateDisplay(c,todisplay){
	var displayed=c.displayed;
	if (displayed) {
	    var i=0; var lim=displayed.length;
	    while (i<lim) fdjtDOM.dropClass(displayed[i++],"displayed");
	    c.displayed=displayed=[];}
	if (todisplay) {
	    c.displayed=todisplay;
	    var i=0; var lim=todisplay.length;
	    while (i<lim) {
		var node=todisplay[i++];
		if (fdjtDOM.hasClass(node,"completion")) 
		    fdjtDOM.addClass(node,"displayed");
		else {
		    var head=fdjtDOM.getParent(node,".completion");
		    if ((head)&&(!(fdjtDOM.hasClass(head,"displayed")))) {
			fdjtDOM.addClass(head,"displayed");
			fdjtDOM.addClass(node,"displayed");}}}}}


    Completions.prototype.getCompletions=function(string) {
	if ((string===this.curstring)||(string===this.maxstring)||
	    ((this.curstring)&&(this.maxstring)&&
	     (fdjtString.hasPrefix(string,this.curstring))&&
	     (fdjtString.hasPrefix(this.maxstring,string))))
	    return this.result;
	else {
	    if (!(this.initialized)) initCompletions(this);
	    var result=getNodes(string,this.prefixtree,this.bykey);
	    updateDisplay(this,result.matches);
	    this.curstring=string;
	    this.maxstring=result.prefix||string;
	    this.result=result;
	    return result;}};

    Completions.prototype.getValue=function(completion) {
	if (completion.value) return completion.value;
	else if (completion.getAttribute("value"))
	    return completion.getAttribute("value");
	var pos=fdjtKB.position(this.nodes,completion);
	if (pos<0) return false;
	else return this.values[pos];};

    Completions.prototype.complete=function(string){
	if (!(this.initialized)) initCompletions(this);
	if ((!(string))&&(string!==""))
	    string=((this.getText)?(this.getText(this.input)):(this.input.value));
	if (fdjtString.isEmpty(string)) {
	    if (this.displayed) updateDisplay(this,false);
	    fdjtDOM.addClass(this.dom,"noinput");
	    fdjtDOM.dropClass(this.dom,"noresults");
	    return [];}
	var result=this.getCompletions(string);
	if ((!(result))||(result.length===0)) {
	    updateDisplay(this,false);
	    fdjtDOM.dropClass(this.dom,"noinput");
	    fdjtDOM.addClass(this.dom,"noresults");
	    return [];}
	else {
	    updateDisplay(this,result.matches);
	    fdjtDOM.dropClass(this.dom,"noinput");
	    fdjtDOM.dropClass(this.dom,"noresults");}
	return result;};

    Completions.prototype.setCues=function(values){
	var curcues=fdjtDOM.getChildren(this.dom,"cue");
	var i=0; var lim=curcues.length;
	while (i<lim) fdjtDOM.dropClass(curcues[i++],"cue");
	var byvalue=this.byvalue;
	i=0; lim=values.length;
	while (i<lim) {
	    var cue=byvalue[values[i++]];
	    if (cue) fdjtDOM.addClass(cue,"cue");}};
    
    /* Constants */
    // Always set to distinguish no options from false
    var FDJT_COMPLETE_OPTIONS=1;
    // Whether the completion element is a cloud (made of spans)
    var FDJT_COMPLETE_CLOUD=2;
    // Whether to require that completion match an initial segment
    var FDJT_COMPLETE_ANYWORD=4;
    // Whether to match case in keys to completions
    var FDJT_COMPLETE_MATCHCASE=8;
    // Whether to an enter character always picks a completion
    var FDJT_COMPLETE_EAGER=16;
    // Whether the key fields may contain disjoins (e.g. (dog|friend))
    // to be accomodated in matching
    var FDJT_COMPLETE_DISJOINS=32;
    // Default options
    var default_options=FDJT_COMPLETE_OPTIONS;
    // Max number of completions to show
    var maxcomplete=50;
    
    fdjtUI.FDJT_COMPLETE_OPTIONS=FDJT_COMPLETE_OPTIONS;
    fdjtUI.FDJT_COMPLETE_CLOUD=FDJT_COMPLETE_CLOUD;
    fdjtUI.FDJT_COMPLETE_ANYWORD=FDJT_COMPLETE_ANYWORD;
    fdjtUI.FDJT_COMPLETE_MATCHCASE=FDJT_COMPLETE_MATCHCASE;
    fdjtUI.FDJT_COMPLETE_EAGER=FDJT_COMPLETE_EAGER;

    function stdspace(string){
	return string.replace(/\s+/," ").replace(/(^\s)|(\s$)/,"");}

    fdjtUI.Completions=Completions;

    var timeouts={};

    fdjtUI.Delay=function(interval,name,fcn){
	window.setTimeout(fcn,interval);};

    fdjtUI.Expansion.onclick=function(evt){
	var target=fdjtUI.T(evt);
	var wrapper=fdjtDOM.getParent(target,".fdjtexpands");
	if (wrapper) fdjtDOM.toggleClass(wrapper,"expanded");};

    var saved_scroll=false;
    var use_native_scroll=false;
    var preview_elt=false;

    function scroll_discard(ss){
	if (ss) {
	    ss.scrollX=false; ss.scrollY=false;}
	else saved_scroll=false;}

    function scroll_save(ss){
	if (ss) {
	    ss.scrollX=window.scrollX; ss.scrollY=window.scrollY;}
	else {
	    if (!(saved_scroll)) saved_scroll={};
	    saved_scroll.scrollX=window.scrollX;
	    saved_scroll.scrollY=window.scrollY;}}
    
    function scroll_offset(wleft,eleft,eright,wright){
	var result;
	if ((eleft>wleft) && (eright<wright)) return wleft;
	else if ((eright-eleft)<(wright-wleft)) 
	    return eleft-Math.floor(((wright-wleft)-(eright-eleft))/2);
	else return eleft;}

    function scroll_into_view(elt,topedge){
	if ((topedge!==0) && (!topedge) && (fdjtDOM.isVisible(elt)))
	    return;
	else if ((use_native_scroll) && (elt.scrollIntoView)) {
	    elt.scrollIntoView(top);
	    if ((topedge!==0) && (!topedge) && (fdjtDOM.isVisible(elt,true)))
		return;}
	else {
	    var top = elt.offsetTop;
	    var left = elt.offsetLeft;
	    var width = elt.offsetWidth;
	    var height = elt.offsetHeight;
	    var winx=(window.pageXOffset||document.documentElement.scrollLeft||0);
	    var winy=(window.pageYOffset||document.documentElement.scrollTop||0);
	    var winxedge=winx+(document.documentElement.clientWidth);
	    var winyedge=winy+(document.documentElement.clientHeight);
	    
	    while(elt.offsetParent) {
		elt = elt.offsetParent;
		top += elt.offsetTop;
		left += elt.offsetLeft;}
	    
	    var targetx=scroll_offset(winx,left,left+width,winxedge);
	    var targety=
		(((topedge)||(topedge===0)) ?
		 ((typeof topedge === "number") ? (top+topedge) : (top)) :
		 (scroll_offset(winy,top,top+height,winyedge)));
	    
	    window.scrollTo(targetx,targety);}}

    fdjtUI.scrollTo=function(target,id,context,discard,topedge){
	scroll_discard(discard);
	if (id) document.location.hash=id;
	if (context) {
	    setTimeout(function() {
		scroll_into_view(context,topedge);
		if (!(fdjtDOM.isVisible(target))) {
		    scroll_into_view(target,topedge);}},
		       100);}
	else setTimeout(function() {scroll_into_view(target,topedge);},100);};

    function scroll_preview(target,context,delta){
	/* Stop the current preview */
	if (!(target)) {
	    stop_preview(); return;}
	/* Already previewing */
	if (target===preview_elt) return;
	if (!(saved_scroll)) scroll_save();
	scroll_into_view(target,delta);
	preview_elt=target;}

    function scroll_restore(ss){
	if (preview_elt) {
	    preview_elt=false;}
	if ((ss) && (typeof ss.scrollX === "number")) {
	    // fdjtLog("Restoring scroll to %d,%d",ss.scrollX,ss.scrollY);    
	    window.scrollTo(ss.scrollX,ss.scrollY);
	    return true;}
	else if ((saved_scroll) &&
		 ((typeof saved_scroll.scrollY === "number") ||
		  (typeof saved_scroll.scrollX === "number"))) {
	    // fdjtLog("Restoring scroll to %o",_fdjt_saved_scroll);
	    window.scrollTo(saved_scroll.scrollX,saved_scroll.scrollY);
	    saved_scroll=false;
	    return true;}
	else return false;}

    function stop_preview(){
	fdjtDOM.dropClass(document.body,"preview");
	if ((preview_elt) && (preview_elt.className))
	    fdjtDOM.dropClass(preview_elt,"previewing");
	preview_elt=false;}

    fdjtUI.scrollIntoView=scroll_into_view;
    fdjtUI.scrollPreview=scroll_preview;
    fdjtUI.scrollRestore=scroll_restore;
    
    fdjtUI.T=function(evt) {
	evt=evt||event; return (evt.target)||(evt.srcElement);};

    fdjtUI.cancel=function(evt){
	evt=evt||event;
	if (evt.preventDefault) evt.preventDefault();
	else evt.returnValue=false;
	evt.cancelBubble=true;};
})();

/* Emacs local variables
;;;  Local variables: ***
;;;  compile-command: "make; if test -f ../makefile; then cd ..; make; fi" ***
;;;  End: ***
*/
