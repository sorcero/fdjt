/* -*- Mode: Javascript; -*- */

/* ######################### fdjt/log.js ###################### */

/* Copyright (C) 2009-2015 beingmeta, inc.
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
/* jshint browser: true */

// var fdjt=((window)?((window.fdjt)||(window.fdjt={})):({}));

fdjt.Log=(function(){
    "use strict";
    var fdjtString=fdjt.String;

    var backlog=[];

    var use_console_log;
    var compactString=fdjt.Time.compactString, ET=fdjt.ET;

    function fdjtLog(string){
        var output=false; var now=ET(), date=new Date();
        var i, lim;
        if (((fdjtLog.doformat)||(string.search("%j")))&&
            (typeof fdjtString !== 'undefined'))
            output=fdjtString.apply(null,arguments);
        if (fdjtLog.console_fn) {
            if (output) fdjtLog.console_fn.call(fdjtLog.console,output);
            else fdjtLog.console_fn.apply(fdjtLog.console,arguments);}
        if (fdjtLog.logurl) {
            var msg="["+now+"s "+compactString(date,false)+"] "+
                fdjtString.apply(null,arguments);
            if (window.console)
                window.console.log("remote logging %s",msg);
            remote_log(msg);}
        if (fdjtLog.console) {
            var domconsole=fdjtLog.console;
            var timespan=fdjt.DOM("span.time",now);
            var abstime=fdjt.DOM("span.abstime",compactString(date));
            var entry=fdjt.DOM("div.fdjtlog");
            if (output) entry.innerHTML=output;
            else entry.innerHTML=fdjtString.apply(null,arguments);
            fdjt.DOM.prepend(entry,timespan);
            fdjt.DOM.prepend(entry,abstime);
            if (typeof domconsole === 'string') {
                var found=document.getElementById(domconsole);
                if (found) {
                    domconsole=fdjtLog.console=found;}
                else domconsole=false;}
            if ((domconsole)&&(!(domconsole.nodeType))) domconsole=false;
            if ((domconsole)&&(fdjtLog.livelog)) {
                update_log(domconsole);
                domconsole.appendChild(entry);
                domconsole.appendChild(document.createTextNode("\n"));}
            else if ((!(domconsole))||(domconsole.offsetHeight===0))
                backlog.push(entry);
            else {
                update_log(domconsole);
                domconsole.appendChild(entry);
                domconsole.appendChild(document.createTextNode("\n"));}}
        if ((fdjtLog.useconsole)||
            ((!(fdjtLog.console))&&(!(fdjtLog.console_fn)))) {
            if (typeof use_console_log === 'undefined')
                init_use_console_log();
            if (use_console_log) {
                if (!(window.console.log.call)) 
                    // In IE, window.console.log is an object, not a function,
                    //  but a straight call still works.
                    window.console.log(
                        "["+now+"s] "+fdjtString.apply(null,arguments));
                else if (output)
                    window.console.log.call(
                        window.console,"["+now+"s] "+output);
                else {
                    var newargs=new Array(arguments.length+1);
                    newargs[0]="[%fs] "+string;
                    newargs[1]=now;
                    i=1; lim=arguments.length;
                    while (i<lim) {newargs[i+1]=arguments[i]; i++;}
                    window.console.log.apply(window.console,newargs);}}}}
    fdjtLog.console=null;

    function update_log(domconsole){
        if ((backlog)&&(backlog.length)) {
            var frag=document.createDocumentFragment();
            var log=backlog; backlog=false;
            var i=0, lim=log.length; while (i<lim) {
                frag.appendChild(log[i++]);
                frag.appendChild(document.createTextNode("\n"));}
            domconsole.appendChild(frag);
            backlog=[];}}
    function updateLogHandler(){
        if (fdjtLog.console) update_log(fdjtLog.console);}
    fdjtLog.update=updateLogHandler;
    
    function remote_log(msg){
        var req=new XMLHttpRequest();
        req.open('POST',fdjtLog.logurl,(!(fdjtLog.logsync)));
        req.setRequestHeader("Content-type","text; charset=utf-8");
        req.send(msg);
        return req;}

    
    function fdjtLogWarn(){
        if ((!(fdjtLog.console_fn))&&
            (!(window.console)&&(window.console.log)&&
             (window.console.log.count))) {
            var output=fdjtString.apply(null,arguments);
            window.alert(output);}
        else fdjtLog.apply(null,arguments);}
    fdjtLog.warn=fdjtLogWarn;
    
    function fdjtLogUhOh(){
        if (fdjtLog.debugging) 
            fdjtLog.warn.call(null,arguments);}
    fdjtLog.uhoh=fdjtLogUhOh;
    
    function fdjtLogBkpt(){
        var output=false;
        if ((fdjtLog.doformat)&&(typeof fdjtString !== 'undefined'))
            output=fdjtString.apply(null,arguments);
        if (fdjtLog.console_fn)
            if (output) fdjtLog.console_fn(fdjtLog.console,output);
        else fdjtLog.console_fn.apply(fdjtLog.console,arguments);
        else if ((window.console) && (window.console.log) &&
                 (window.console.count))
            if (output)
                window.console.log.call(window.console,output);
        else window.console.log.apply(window.console,arguments);}
    fdjtLog.bkpt=fdjtLogBkpt;

    fdjtLog.useconsole=true;

    function init_use_console_log() {
        if ((window.console)&&(window.console.log)) {
            if (window.console.count) use_console_log=true;
            else {
                use_console_log=true;
                try {window.console.log("Testing console");}
                catch (ex) { use_console_log=false;}}}
        else use_console_log=false;}

    // This is for temporary trace statements; we use a different name
    //  so that they're easy to find.
    fdjt.Trace=fdjt.Log;
    
    fdjtLog.getBacklog=function getBacklog(){return backlog;};

    return fdjtLog;})(window,document);


/* Emacs local variables
   ;;;  Local variables: ***
   ;;;  compile-command: "make; if test -f ../makefile; then cd ..; make; fi" ***
   ;;;  indent-tabs-mode: nil ***
   ;;;  End: ***
*/
