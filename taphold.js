/* -*- Mode: Javascript; -*- */

/* ######################### fdjt/taphold.js ###################### */

/* Copyright (C) 2009-2012 beingmeta, inc.

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

if (window) {
    if (!(window.fdjt)) window.fdjt={};}
else if (typeof fdjt === "undefined") fdjt={};
else {}
if (!(fdjt.UI)) fdjt.UI={};

fdjt.UI.TapHold=(function(){
    var fdjtString=fdjt.DOM;
    var fdjtLog=fdjt.Log;
    var fdjtDOM=fdjt.DOM;
    var fdjtUI=fdjt.UI;
    var fdjtET=fdjt.ET;

    var trace_taps=false;
    var debug_taps=false;
    var window_setup=false;
    
    var touched=false;
    var pressed=false;
    var tap_target=false;
    var th_target=false;
    var th_targets=[];
    var th_timer=false;
    var mouse_down=false;
    var holdkey_down=false;
    var start_x=false;
    var start_y=false;
    var start_t=false;
    var touch_x=false;
    var touch_y=false;
    
    var getGeometry=fdjtDOM.getGeometry;
    var addClass=fdjtDOM.addClass;
    var dropClass=fdjtDOM.dropClass;
    var hasClass=fdjtDOM.hasClass;
    var getParent=fdjtDOM.getParent;
    var hasParent=fdjtDOM.hasParent;
    var reticle=fdjtUI.Reticle;
    var cancel=fdjtUI.cancel;
    // We disable the default behavior, which is usually selection
    // (where we do tap and hold)
    var noDefault=fdjtUI.noDefault;
    var dontcancel=function(evt){};

    var keynums={
        shift: 16, alt: 18, control: 17, meta: 224,
        os: 91, altgr: 225, fn: -1,
        numlock: 144, capslock: 20, scrolllock: 145};
    var keynames={};
    for (var akeyname in keynums)
        if (keynums.hasOwnProperty(akeyname)) {
            var akeynum=keynums[akeyname];
            if ((typeof akeynum === 'number')&&(akeynum>0))
                keynames[akeynum]=akeyname;}
    
    function getTarget(evt){
        if ((evt.changedTouches)&&((evt.changedTouches.length)))
            return evt.changedTouches[evt.changedTouches.length-1].target;
        else return fdjtUI.T(evt);}

    function getClientX(evt){
        if (typeof evt.clientX === "number") return evt.clientX;
        var touches=((evt.changedTouches)&&(evt.changedTouches.length)&&
                     (evt.changedTouches))||
            ((evt.touches)&&(evt.touches.length)&&(evt.touches));
        if (touches) return touches[0].screenX;
        else return false;}
    function getClientY(evt){
        if (typeof evt.clientY === "number") return evt.clientY;
        var touches=((evt.changedTouches)&&(evt.changedTouches.length)&&
                     (evt.changedTouches))||
            ((evt.touches)&&(evt.touches.length)&&(evt.touches));
        if (touches) return touches[0].screenY;
        else return false;}
    
    function dispatchEvent(target,etype,orig){
        if (!(target)) target=fdjtUI.T(orig);
        var evt = document.createEvent("UIEvent");
        var event_arg=
            (((orig)&&(orig.touches)&&(orig.touches.length))||
             ((orig)&&(orig.button))||
             0);
        evt.initUIEvent(etype, true, true,window,event_arg);
        evt.clientX=touch_x; evt.clientY=touch_y;
        if (trace_taps)
            fdjtLog("TapHold/Synthesizing %s on %o @%d,%d from %o",
                    etype,target,touch_x,touch_y,orig||"scratch");
	if (holdkey_down) evt.holdKey=true;
        if (orig) {
	    cancel(orig);
            if (!(hasParent(target,document.body)))
		target=fdjtUI.T(orig);}
        if ((!target)||(!(hasParent(target,document.body))))
            target=document.elementFromPoint(touch_x,touch_y);
        target.dispatchEvent(evt);}
    
    function tap_handler(evt){
        var target=fdjtUI.T(evt);
        var msgelt=fdjtID("TAPHOLDMESSAGE");
        if (msgelt) msgelt.innerHTML=fdjtString("Tapped %o",target);
        fdjtLog("Tapped %o",target);}
    function hold_handler(evt){
        var target=fdjtUI.T(evt);
        var msgelt=fdjtID("TAPHOLDMESSAGE");
        if (msgelt) msgelt.innerHTML=fdjtString("Held %o",target);
        fdjtLog("Held %o",target);}
    function release_handler(evt){
        var target=fdjtUI.T(evt);
        var msgelt=fdjtID("TAPHOLDMESSAGE");
        if (msgelt) msgelt.innerHTML=fdjtString("Released %o",target);
        fdjtLog("Released %o",target);}

    function tapped(target,evt){return dispatchEvent(target,"tap",evt);}
    function held(target,evt){return dispatchEvent(target,"hold",evt);}
    function released(target,evt){return dispatchEvent(target,"release",evt);}
    function slipped(target,evt){return dispatchEvent(target,"slip",evt);}
    function taptapped(target,evt){
        return dispatchEvent(target,"taptap",evt);}
    function tapheld(target,evt){
        return dispatchEvent(target,"taphold",evt);}
    
    function startpress(evt,holdthresh){
        evt=evt||event;
        if ((tap_target)&&(th_timer)) {
            clearTimeout(th_timer); th_timer=false;}
        if ((touched)||(pressed)||(th_timer)) return;
        else if (!(th_target)) return;
        else {touched=th_target; pressed=false;}
        if (trace_taps) fdjtLog("TapHold/startpress %o",evt);
        if (reticle.live) reticle.highlight(true);
        noDefault(evt);
        th_timer=setTimeout((function(){
            if (trace_taps) fdjtLog("TapHold/startpress/timeout %o",evt);
            if (th_targets.length>0) {
                var touched=th_targets;
                var i=0, lim=touched.length;
                while (i<lim) {
                    var elt=touched[i++];
                    if ((i===lim)&&(elt===th_target)) break;
                    held(elt); slipped(elt);}}
            pressed=th_target; th_targets=[];
            if (tap_target) {tapheld(th_target,evt); tap_target=false;}
            else held(th_target,evt);
            th_timer=false;
            touched=false;}),
                            holdthresh||TapHold.interval||100);}
    function endpress(evt,taptapthresh){
        if ((!(pressed))&&(!(touched))&&(!(th_timer))) return;
        if (trace_taps)
            fdjtLog("TapHold/endpress %o t=%o p=%o tch=%o tm=%o ttt=%o/%o",
                    evt,th_target,pressed,touched,th_timer,
                    tap_target,taptapthresh||false);
        if (th_timer) {
            clearTimeout(th_timer); th_timer=false;
            if (reticle.live) 
                setTimeout(function(){reticle.highlight(false);},1500);
            if (th_target===touched) {
                if ((tap_target)&&(tap_target===th_target)) {
                    tap_target=false;
                    taptapped(th_target,evt);}
                else if (taptapthresh) {
                    tap_target=th_target;
                    if (trace_taps)
                        fdjtLog("TapHold/taptap waiting %d on %o",
                                taptapthresh,tap_target);
                    th_timer=setTimeout(function(){
                        var tmp=tap_target; tap_target=false;
                        th_timer=false;
                        if (trace_taps)
                            fdjtLog("TapHold/singletap on %o",tmp);
                        tapped(tmp,evt);},
                                        taptapthresh);}
                else tapped(th_target,evt);}
            else slipped(th_target,evt);}
        else if (pressed) released(pressed,evt);
        if (reticle.live) reticle.highlight(false);
        if (evt) noDefault(evt);
        start_x=false; start_y=false; start_t=false;
        touched=false; pressed=false;
        th_targets=[];}
    function abortpress(evt){
        if (trace_taps)
            fdjtLog("TapHold/abort %o: th=%o t=%o p=%o",
                    evt,th_target,touched,pressed);
        if (th_timer) {
            clearTimeout(th_timer); th_timer=false;}
        else if (pressed) {released(pressed,evt);}
        if (reticle.live) reticle.highlight(false);
        touched=false; pressed=false; tap_target=false;
        th_targets=[];}
    function taphold_mouseout(evt){
        var to=evt.toElement||evt.relatedTarget;
        if ((pressed)&&(!(hasParent(to,".fdjtaphold")))) {
            if (!(holdkey_down)) {
                released(pressed,evt);
                touched=pressed=th_target=false;}
            mouse_down=false;}}

    function taphold_outer_move(evt){
        evt=evt||event;
        var target;
        if (evt.touches) {
            var x=evt.clientX||getClientX(evt);
            var y=evt.clientY||getClientY(evt);
            target=document.elementFromPoint(x,y);}
        else target=fdjtUI.T(evt);
        // If it doesn't have a parent, it's been removed from the DOM,
        //  so we can't tell if it *was* in a .fdjtaphold region, so we punt.
        if ((!(target))||(!(target.parentNode))) return;
        if ((pressed)&&(!(hasParent(target,".fdjtaphold")))) {
            if ((pressed)&&(trace_taps))
                fdjtLog("TapHold/slipout %o: t=%o p=%o",
                        evt,th_target,pressed);
            released(pressed);
            touched=pressed=th_target=false; th_targets=[];
            mouse_down=false;
            return;}}
    function taphold_outer_down(evt){mouse_down=true;};
    function taphold_outer_up(evt){mouse_down=false;};
    
    function taphold_move(evt,movethresh){
        evt=evt||event;
        var target;
        // if (target!==th_target) fdjtLog("New target %o",target);
        touch_x=evt.clientX||getClientX(evt);
        touch_y=evt.clientY||getClientY(evt);
        // If touched is false, the tap/hold was aborted somehow
        if (!(touched)) return;
        if (evt.touches)
            target=document.elementFromPoint(touch_x,touch_y);
        else target=fdjtUI.T(evt);
        if (trace_taps)
            fdjtLog("TapHold/move %o %o -> %o s=%d,%d t=%d,%d, thresh=%o",
                    evt,th_target,target,start_x,start_y,
                    touch_x,touch_y,movethresh);
        if ((movethresh)&&(start_x)&&(start_y)&&(th_timer)) {
            var distance=(Math.abs(touch_x-start_x))+
                (Math.abs(touch_y-start_y));
            if (distance>movethresh) {
                if (trace_taps)
                    fdjtLog("TapHold/move/cancel s=%d,%d t=%d,%d d=%d thresh=%o",
                            start_x,start_y,touch_x,touch_y,
                            distance,movethresh);
                abortpress(evt);
                touched=th_timer=pressed=th_target=false;
                th_targets=[];
                return;}
            else if (trace_taps)
                fdjtLog("TapHold/moved s=%d,%d t=%d,%d d=%d thresh=%o",
                        start_x,start_y,touch_x,touch_y,
                        distance,movethresh);}
        if (hasParent(target,".fdjtaphold")) th_target=target;
        if ((evt.touches)&&(touched)&&(!(pressed))&&
            (th_targets[th_targets.length-1]!==th_target))
            th_targets.push(th_target);
        if ((evt.touches)&&(evt.touches.length)&&(evt.touches.length>1))
            return;
        else {
            if (reticle.live) reticle.onmousemove(evt);
            if (th_target) noDefault(evt);}
        if ((pressed)&&(th_target!==pressed)) {
            slipped(pressed);
            pressed=th_target;
            held(pressed);}}
    
    function taphold_keydown(evt){
        evt=evt||event;
        if (!(TapHold.holdkey)) return;
        var holdkey=TapHold.holdkey, holdkeynum, holdkeyname;
        if (!(holdkey)) return;
        else if (holdkey===true) holdkey="Shift";
        if (typeof holdkey === 'number') {
            holdkeyname=keynames[holdkey];
            holdkeynum=holdkey;}
        else if (typeof holdkey === 'string') {
            holdkeynum=keynums[holdkey.toLowerCase()];
            holdkeyname=holdkey.toLowerCase();}
        else {
            fdjtLog.warn("Invalid holdkey specification %s",holdkey);
            return;}
        if ((evt.key===holdkeyname)||
            (evt.keyCode===holdkeynum)||
            ((evt.getModifierState)&&
             (evt.getModifierState(holdkeyname)))) {
            holdkey_down=true;
            var target=fdjtUI.T(evt);
            if ((target)&&(target.tagName)&&
                ((target.tagName==='INPUT')||
                 (target.tagName==='TEXTAREA')||
                 (hasParent(target,"input,textarea"))))
                return;
            else if (!(touched)) startpress(evt);}}
    function taphold_down(evt,holdthresh){
        evt=evt||event;
        if ((evt.ctrlKey)||
            (evt.altKey)||(evt.metaKey)||
            (evt.button)||
            ((evt.which)&&(evt.which>1)))
            return;
        mouse_down=true;
        th_target=fdjtUI.T(evt); th_targets=[th_target];
        start_x=touch_x=evt.clientX||getClientX(evt);
        start_y=touch_y=evt.clientY||getClientY(evt);
        start_t=fdjtET();
        if (trace_taps)
            fdjtLog("TapHold/down %o t=%o x=%o y=%o t=%o",
                    evt,th_target,start_x,start_y,start_t);
        if ((evt.touches)&&(evt.touches.length)&&
            (evt.touches.length>1))
            return;
        if (fdjtUI.isClickable(evt)) return;
        if (!(touched)) startpress(evt,holdthresh);
        noDefault(evt);}
    function fakePress(evt,holdthresh){
        var x=start_x=touch_x=evt.clientX||getClientX(evt);
        var y=start_y=touch_y=evt.clientY||getClientY(evt);
        start_t=fdjtET();
        var target=document.elementFromPoint(x,y);
        th_target=target; th_targets=[target];
        mouse_down=true;
        if (trace_taps)
            fdjtLog("TapHold/fakePress t=%o x=%o y=%o t=%o",
                    th_target,start_x,start_y,start_t);
        startpress(evt,holdthresh);}
    
    function taphold_keyup(evt){
        evt=evt||event;
        if (!(TapHold.holdkey)) return;
        var holdkey=TapHold.holdkey, holdkeynum, holdkeyname;
        if (!(holdkey)) return;
        else if (holdkey===true) holdkey="Shift";
        if (typeof holdkey === 'number') {
            holdkeyname=keynames[holdkey];
            holdkeynum=holdkey;}
        else if (typeof holdkey === 'string') {
            holdkeynum=keynums[holdkey.toLowerCase()];
            holdkeyname=holdkey.toLowerCase();}
        else {
            fdjtLog.warn("Invalid holdkey specification %s",holdkey);
            return;}
        if ((evt.key===holdkeyname)||
            (evt.keyCode===holdkeynum)||
            ((evt.getModifierState)&&
             (evt.getModifierState(holdkeyname)))) {
            holdkey_down=false;
            if ((!(holdkey_down))&&(!(mouse_down)))
                endpress();}}
    TapHold.keyup=taphold_keyup;
    function taphold_up(evt,taptapthresh){
        evt=evt||event;
        if (!(mouse_down)) return;
        mouse_down=false;
        touch_x=evt.clientX||getClientX(evt)||touch_x;
        touch_y=evt.clientY||getClientY(evt)||touch_y;
        if (trace_taps)
            fdjtLog("TapHold/up %o tht=%o s=%o,%o,%o t=%o,%o m=%o k=%o ttt=%o",
                    evt,th_target,start_x,start_y,start_t,touch_x,touch_y,
                    mouse_down,holdkey_down,
                    taptapthresh||false);
        if ((evt.touches)&&(evt.touches.length)&&
            (evt.touches.length>1))
            return;
        if (fdjtUI.isClickable(evt)) return;
        if ((!(holdkey_down))&&(!(mouse_down))&&(touched)) {
            fdjtUI.cancel(evt);
            endpress(evt,taptapthresh);}
        else {}}

    function get_down_handler(holdthresh){
        return function(evt){
            return taphold_down(evt,holdthresh);}}

    function get_move_handler(movethresh){
        return function(evt){
            return taphold_move(evt,movethresh);}}

    function get_up_handler(taptapthresh){
        return function(evt){
            return taphold_up(evt,taptapthresh);}}

    function TapHold(elt,fortouch,holdthresh,movethresh,taptapthresh){
        if (!(elt)) {
            fdjtLog.warn("TapHold with no argument!");
            return;}
        if ((fortouch)&&(fortouch.hasOwnProperty)) {
            var opts=fortouch;
            if (opts.hasOwnProperty("touch")) fortouch=opts.touch;
            else fortouch=false;
            if (!(holdthresh)) holdthresh=opts.hold||opts.holdthresh;
            if (!(movethresh)) movethresh=opts.move||opts.movethresh;
            if (!(taptapthresh)) taptapthresh=opts.taptap||opts.taptapthresh;}
        else if (!(fortouch)) fortouch=false;
        if (typeof holdthresh !== "number")
            holdthresh=TapHold.holdthresh||300;
        if (typeof movethresh !== "number")
            movethresh=TapHold.movethresh||20;
        if (typeof movethresh !== "number") 
        if ((taptapthresh)&&(typeof taptapthresh !== "number"))
            taptapthresh=TapHold.taptapthresh||200;
        addClass(elt,"fdjtaphold");
        var mm=((movethresh)?(get_move_handler(movethresh)):(taphold_move));
        if (!(fortouch)) fdjtDOM.addListener(elt,"mousemove",mm);
        fdjtDOM.addListener(elt,"touchmove",mm);
        var md=((holdthresh)?(get_down_handler(holdthresh)):(taphold_down));
        if (!(fortouch)) fdjtDOM.addListener(elt,"mousedown",md);
        if (!(fortouch)) fdjtDOM.addListener(elt,"mouseout",taphold_mouseout);
        fdjtDOM.addListener(elt,"touchstart",md);
        var mu=((taptapthresh)?(get_up_handler(taptapthresh)):(taphold_up));
        if (!(fortouch)) fdjtDOM.addListener(elt,"mouseup",mu);
        fdjtDOM.addListener(elt,"touchend",mu);
        fdjtDOM.addListener(elt,"touchcancel",abortpress);        
        if (!(window_setup)) {
            if (!(fortouch)) {
                // fdjtDOM.addListener(document,"mouseup",taphold_outer_up);
                // fdjtDOM.addListener(document,"mousedown",taphold_outer_down);
                fdjtDOM.addListener(document,"mousemove",taphold_outer_move);}
            fdjtDOM.addListener(document,"touchmove",taphold_outer_move);
            fdjtDOM.addListener(document,"keydown",taphold_keydown);
            fdjtDOM.addListener(document,"keyup",taphold_keyup);
            window_setup=window;}
        if (debug_taps) {
            fdjtDOM.addListener(elt,"tap",tap_handler);
            fdjtDOM.addListener(elt,"hold",hold_handler);
            fdjtDOM.addListener(elt,"release",release_handler);}}
    TapHold.mouseup=TapHold.up=taphold_up;
    TapHold.mousedown=TapHold.down=taphold_down;
    TapHold.keydown=taphold_keydown;
    TapHold.holdkey=16;
    TapHold.fakePress=fakePress;

    TapHold.traceTaps=function(flag){
        if (typeof flag === "undefined")
            trace_taps=(!(trace_taps));
        else trace_taps=flag;};

    TapHold.ispressed=function(){
        return (pressed);}

    return TapHold;})();


/* Emacs local variables
   ;;;  Local variables: ***
   ;;;  compile-command: "make; if test -f ../makefile; then cd ..; make; fi" ***
   ;;;  indent-tabs-mode: nil ***
   ;;;  End: ***
*/
