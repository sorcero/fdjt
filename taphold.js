/* -*- Mode: Javascript; -*- */

/* ######################### fdjt/taphold.js ###################### */

/* Copyright (C) 2009-2013 beingmeta, inc.

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
    if (!(fdjt.UI)) fdjt.UI={};

fdjt.TapHold=fdjt.UI.TapHold=(function(){
    "use strict";
    var fdjtLog=fdjt.Log;
    var fdjtDOM=fdjt.DOM;
    var fdjtTime=fdjt.Time;
    var fdjtUI=fdjt.UI;
    var fdjtET=fdjt.ET;

    var trace_taphold=false;
    var window_setup=false;
    
    var getChildren=fdjtDOM.getChildren;
    var addClass=fdjtDOM.addClass;
    var dropClass=fdjtDOM.dropClass;
    var getParent=fdjtDOM.getParent;
    var hasParent=fdjtDOM.hasParent;
    var reticle=fdjtUI.Reticle;
    var cancel=fdjtUI.cancel;
    // We disable the default behavior, which is usually selection
    // (where we do tap and hold)
    var noDefault=fdjtUI.noDefault;

    var cleared=0;
    var serial_count=1;

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
    
    function dispatchEvent(target,etype,orig,tx,ty,also){
        var orig_target=(orig)&&(fdjtUI.T(orig));
        if (!(target)) target=orig_target;
        var evt = document.createEvent("UIEvent");
        var event_arg=
            (((orig)&&(orig.touches)&&(orig.touches.length))||
             ((orig)&&(orig.button))||
             0);
        evt.initUIEvent(etype, true, true,window,event_arg);
        evt.clientX=tx; evt.clientY=ty;
        if (also) {
            for (var prop in also) {
                if (also.hasOwnProperty(prop)) {
                    evt[prop]=also[prop];}}}
        if (trace_taphold)
            fdjtLog("TapHold/Synthesizing %s on %o @%d,%d from %o given %o",
                    etype,target,tx,ty,orig||"scratch",also);
        if (orig) cancel(orig);
        if ((!target)||(!(hasParent(target,document.body))))
            target=document.elementFromPoint(tx,ty);
        if (orig_target!==target)
            evt.relatedTarget=orig_target;
        target.dispatchEvent(evt);}
    
    /* This gets the target based on geometry. */
    function getRealTarget(holder,touchable,x,y){
        var children=getChildren(holder,touchable);
        var i=0, lim=children.length;
        while (i<lim) {
            var child=children[i++];
            var left=child.offsetLeft, top=child.offsetTop;
            var right=child.offsetRight, bot=child.offsetBottom;
            if (typeof left !== "number") continue;
            else if ((((right-left)<=1)?
                      ((x>=left)&&(y<=right)):
                      ((x>=left)&&(y<right)))&&
                     (((bot-top)<=1)?
                      ((y>=top)&&(y<=bot)):
                      ((x>=top)&&(y<bot)))) {
                // fdjtLog("Got %o at %d,%d ltrb=%d,%d,%d,%d",child,x,y,left,top,right,bot);
                return child;}}
        return false;}

    var mouse_down=false;
    function global_mouseup(evt){
        evt=evt||event;
        if (trace_taphold) fdjtLog("TapHold/global/mouseup %o",evt);
        if (evt.button===1) mouse_down=false;}
    function global_mousedown(evt){
        evt=evt||event;
        if (trace_taphold) fdjtLog("TapHold/global/mousedown %o",evt);
        if (evt.button===1) mouse_down=true;}
    function global_mouseout(evt){
        evt=evt||event;
        var target=fdjtUI.T(evt), rel=evt.relatedTarget||evt.toElement;
        if (trace_taphold)
            fdjtLog("TapHold/global/mouseout %o %o==>%o",
                    evt,target,rel);
        if (target===document.documentElement)
            mouse_down=false;}


    function TapHold(elt,fortouch,holdthresh,movethresh,taptapthresh,docancel){
        if (!(elt)) {
            fdjtLog.warn("TapHold with no argument!");
            return;}
        
        if (!(this instanceof TapHold))
            return new TapHold(
                elt,fortouch,holdthresh,movethresh,taptapthresh,docancel);
        
        var th=this;
        var touched=false;
        var pressed=false;
        var pressed_at=false;
        var tap_target=false;
        var th_target=false;
        var th_targets=[];
        var th_timer=false;
        var start_x=false;
        var start_y=false;
        var start_t=false;
        var touch_x=false;
        var touch_y=false;
        var touch_t=0;
        
        var serial=serial_count++;

        var touchable=elt.getAttribute("data-touchable");
        if (touchable) touchable=fdjtDOM.Selector(touchable);
        else touchable=function(e){return hasParent(e,elt);};
        
        function setTarget(t){
            if ((th.trace)||(trace_taphold))
                fdjtLog("TapHold/setTarget(%d) %o cur=%o",serial,t,th_target);
            if (th_target) dropClass(th_target,"tapholdtarget");
            if (t) addClass(t,"tapholdtarget");
            th_target=t;}

        function tapped(target,evt){
            return dispatchEvent(target,"tap",evt,touch_x,touch_y);}
        function held(target,evt){
            addClass(elt,"tapholding");
            return dispatchEvent(target,"hold",evt,touch_x,touch_y);}
        function released(target,evt){
            dropClass(elt,"tapholding");
            return dispatchEvent(target,"release",evt,touch_x,touch_y);}
        function slipped(target,evt,also){
            if ((evt)&&(!(also))) {
                var rel=evt.relatedTarget||fdjtUI.T(evt);
                if (rel===target) also=false;
                else also={relatedTarget: rel};}
            return dispatchEvent(target,"slip",evt,touch_x,touch_y,also);}
        function taptapped(target,evt){
            return dispatchEvent(target,"taptap",evt,touch_x,touch_y);}
        function tapheld(target,evt){
            return dispatchEvent(target,"taphold",evt,touch_x,touch_y);}
        function swiped(target,evt,sx,sy,cx,cy){
            var dx=cx-sx, dy=cy-sy;
            return dispatchEvent(target,"swipe",evt,cx,cy,
                                 {startX: sx,startY: sy,endX: cx,endY: cy,
                                  deltaX: dx,deltaY: dy});}
        
        function startpress(evt){
            evt=evt||event;
            if ((th.trace)||(trace_taphold))
                fdjtLog("TapHold/startpress(%d) %o tht=%o timer=%o tt=%o touched=%o pressed=%o pressed_at=%o",
                        serial,evt,th_target,th_timer,tap_target,touched,pressed);
            if ((tap_target)&&(th_timer)) {
                clearTimeout(th_timer); th_timer=false;}
            if ((touched)||(pressed)||(th_timer)) return;
            else if (!(th_target)) return;
            else {touched=th_target; pressed=false;}
            if (reticle.live) reticle.highlight(true);
            noDefault(evt);
            pressed_at=fdjtTime(); 
            if (th_timer) clearTimeout(th_timer);
            th_timer=setTimeout((function(){
                if ((th.trace)||(trace_taphold))
                    fdjtLog("TapHold/startpress/timeout(%d) %o",serial,evt);
                if (th_targets.length>0) {
                    var targets=th_targets;
                    var i=0, lim=targets.length;
                    while (i<lim) {
                        var elt=targets[i++];
                        if ((i===lim)&&(elt===th_target)) break;
                        held(elt);
                        if (i<lim) slipped(elt,evt,{relatedTarget: targets[i]});
                        else slipped(elt,evt);}}
                pressed=th_target; th_targets=[];
                if (tap_target) {tapheld(th_target,evt); tap_target=false;}
                else held(th_target,evt);
                if (th_timer) clearTimeout(th_timer);
                th_timer=false;
                touched=false;}),
                                holdthresh||TapHold.interval||100);}
        function endpress(evt){
            if ((th.trace)||(trace_taphold))
                fdjtLog("TapHold/endpress(%d) %o t=%o p=%o tch=%o tm=%o ttt=%o/%o",
                        serial,evt,th_target,pressed,touched,th_timer,
                        tap_target,taptapthresh||false);
            if ((!(pressed))&&(!(touched))&&(!(th_timer))) {
                start_x=start_y=start_t=touch_x=touch_y=touch_t=false;
                return;}
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
                        if ((th.trace)||(trace_taphold))
                            fdjtLog("TapHold/taptap(%d) waiting %d on %o",
                                    serial,taptapthresh,tap_target);
                        if (th_timer) clearTimeout(th_timer);
                        th_timer=setTimeout(function(){
                            var tmp=tap_target; tap_target=false;
                            th_timer=false;
                            if ((th.trace)||(trace_taphold))
                                fdjtLog("TapHold/singletap(%d) on %o",serial,tmp);
                            tapped(tmp,evt);},
                                            taptapthresh);}
                    else tapped(th_target,evt);}
                else slipped(th_target,evt);}
            else if (pressed) released(pressed,evt);
            if (reticle.live) reticle.highlight(false);
            if (evt) noDefault(evt);
            start_x=false; start_y=false; start_t=false;
            touched=false; pressed=false;
            setTarget(false);
            dropClass(elt,"tapholding");
            th_targets=[];}
        function abortpress(evt,why){
            if ((th.trace)||(trace_taphold))
                fdjtLog("TapHold/abort%s(%d) %o: th=%o t=%o p=%o",
                        ((why)?("("+why+")"):("")),serial,
                        evt,th_target,touched,pressed);
            if (th_timer) {
                clearTimeout(th_timer); th_timer=false;}
            else if (pressed) {slipped(pressed,evt);}
            if (reticle.live) reticle.highlight(false);
            touched=pressed=tap_target=false;
            // start_x=start_y=start_t=touch_x=touch_y=touch_t=false;
            dropClass(elt,"tapholding");
            th_targets=[];
            setTarget(false);}

        var mouseout_timer=false;

        function taphold_mouseout(evt){
            evt=evt||event;
            var to=evt.toElement||evt.relatedTarget;
            if (mouseout_timer) return;
            if (!(th_target)) return;
            if ((pressed)&&(!(hasParent(to,elt)))) {
                mouseout_timer=setTimeout(function(){
                    slipped(pressed,evt,{relatedTarget: to});
                    abortpress(evt,"taphold_mouseout");},
                                          2000);}}

        function taphold_mouseover(evt){
            evt=evt||event;
            if (mouseout_timer) {
                clearTimeout(mouseout_timer);
                mouseout_timer=false;}}

        function taphold_move(evt){
            evt=evt||event;
            var target;
            if ((pressed)&&(cleared>start_t)) {
                abortpress(evt,"move/cleared");
                return;}
            if (!(mouse_down)) {
                abortpress(evt,"mousemove/up");
                return;}
            
            // if (target!==th_target) fdjtLog("New target %o",target);
            var x=evt.clientX||getClientX(evt);
            var y=evt.clientY||getClientY(evt);
            if (evt.touches) target=document.elementFromPoint(x,y);
            else target=fdjtUI.T(evt);
            if (!(target)) return;
            var holder=getParent(target,".tapholder");
            if (holder!==elt) {
                if ((th.trace)||(trace_taphold)) {
                    trace_ignore_move(evt,serial,elt,holder,th_target,target,
                                      start_x,start_y,touch_x,touch_y);}
                if (pressed) slipped(pressed,evt,{relatedTarget: target});
                return;}
            touch_x=x; touch_y=y; touch_t=fdjtTime();
            // If touched is false, the tap/hold was aborted somehow
            // fdjtLog("taphold_move touched=%o touch_x=%o touch_y=%o",touched,touch_x,touch_y);
            if (!((touched)||(pressed))) return;
            
            if ((th.trace)||(trace_taphold))
                fdjtLog("TapHold/move%s(%d) %o %o -> %o s=%d,%d t=%d,%d, thresh=%o, md=%o",
                        ((mouse_down)?("/md"):("")),serial,
                        evt,th_target,target,start_x,start_y,
                        touch_x,touch_y,movethresh,mouse_down);
            if ((movethresh)&&(start_x)&&(start_y)&&(th_timer)) {
                var distance=(Math.abs(touch_x-start_x))+
                    (Math.abs(touch_y-start_y));
                if (distance>movethresh) {
                    if ((th.trace)||(trace_taphold))
                        fdjtLog("TapHold/move/cancel(%d) s=%d,%d t=%d,%d d=%d thresh=%o, md=%o",
                                serial,start_x,start_y,touch_x,touch_y,
                                distance,movethresh,mouse_down);
                    abortpress(evt,"movefar");
                    if (th_timer) clearTimeout(th_timer);
                    touched=th_timer=pressed=false; th_targets=[];
                    setTarget(false);
                    swiped(target,evt,start_x,start_y,touch_x,touch_y);
                    return;}
                else if ((th.trace)||(trace_taphold))
                    fdjtLog("TapHold/moved(%d) s=%d,%d t=%d,%d d=%d thresh=%o, md=%o",
                            serial,start_x,start_y,touch_x,touch_y,
                            distance,movethresh,mouse_down);}
            target=getParent(target,touchable);
            if (!(target)) target=getRealTarget(elt,touchable,touch_x,touch_y);
            if (!(target)) return;
            if (hasParent(target,".tapholder")) setTarget(target);
            if ((evt.touches)&&(touched)&&(!(pressed))&&
                (th_targets[th_targets.length-1]!==th_target))
                th_targets.push(th_target);
            if ((evt.touches)&&(evt.touches.length)&&(evt.touches.length>1))
                return;
            else {
                if (reticle.live) reticle.onmousemove(evt);
                if (th_target) noDefault(evt);}
            if (!(mouse_down)) {
                slipped(pressed,evt,{relatedTarget: target});
                pressed=false;}
            else if ((pressed)&&(th_target!==pressed)) {
                slipped(pressed,evt,{relatedTarget: target});
                pressed=th_target;
                pressed_at=fdjtTime();
                held(pressed);}
            else {}}
        function trace_ignore_move(evt,serial,elt,holder,th_target,target,
                                   start_x,start_y,touch_x,touch_y) {
            fdjtLog(
                "TapHold/move%s/farout(%d) %o %o -> %o s=%d,%d t=%d,%d",
                ((mouse_down)?("/md"):("")),serial,
                evt,th_target,target,start_x,start_y,
                touch_x,touch_y);
            fdjtLog("TapHold/move/farout(%d) target in %o, elt is %o",
                    serial,holder,elt);}

        
        function taphold_down(evt,holdthresh){
            evt=evt||event;
            if ((evt.ctrlKey)||
                (evt.altKey)||(evt.metaKey)||
                (evt.button)||
                ((evt.which)&&(evt.which>1)))
                return;
            mouse_down=true; cleared=0;
            var new_event=false;
            var target=fdjtUI.T(evt);
            var holder=getParent(target,".tapholder");
            if (holder!==elt) {
                if ((th.trace)||(trace_taphold))
                    fdjtLog("TapHold/down/ignore(%d) %o tht=%o target=%o holder=%o elt=%o",
                            serial,evt,th_target,target,holder,elt);
                return;}

            if (target) target=getParent(target,touchable);
            touch_x=evt.clientX||getClientX(evt)||touch_x;
            touch_y=evt.clientY||getClientY(evt)||touch_y;
            start_x=touch_x; start_y=touch_y;
            touch_t=fdjtTime();
            if (evt.touches) {
                target=document.elementFromPoint(touch_x,touch_y);}
            // if (!(target)) target=getRealTarget(elt,touchable,touch_x,touch_y);
            if ((th.trace)||(trace_taphold))
                fdjtLog("TapHold/down(%d) %o tht=%o target=%o s=%o,%o,%o t=%o,%o m=%o touched=%o pressed=%o ttt=%o",
                        serial,evt,th_target,target,
                        start_x,start_y,start_t,touch_x,touch_y,mouse_down,
                        touched,pressed,
                        taptapthresh||false);

            if (docancel) fdjtUI.cancel(evt);
            
            if ((evt.touches)&&(th_target)) {
                var cur_holder=getParent(elt,".tapholder");
                if ((th.trace)||(trace_taphold) )
                    fdjtLog("TapHold(%d) second touch on %o (in %o) after %o (in %o)",
                            serial,target,holder,th_target,cur_holder);
                if ((cur_holder)&&(cur_holder !== holder)) {
                    var touch=evt.changedTouches[0];
                    if ((th.trace)||(trace_taphold))
                        fdjtLog("TapHold(%d) Clearing taphold on %o, redispatching to %o",
                                serial,th_target,target);
                    new_event=document.createEvent('TouchEvent');
                    new_event.initTouchEvent(
                        evt.type,true,true,window,0,
                        touch.screenX,touch.screenY,touch.clientX,touch.clientY,
                        evt.ctrlKey,evt.altKey,evt.shiftKey,evt.metaKey,
                        document.createTouchList(touch),
                        document.createTouchList(touch),
                        document.createTouchList(touch));}}
            if (new_event) {
                abortpress(evt,"move/touch2");
                target.dispatchEvent(new_event);
                return;}
            else {setTarget(target); th_targets=[];}
            start_t=fdjtET();
            if ((th.trace)||(trace_taphold))
                fdjtLog("TapHold/down(%d) %o t=%o x=%o y=%o t=%o touched=%o",
                        serial,evt,th_target,start_x,start_y,start_t,touched);
            if (fdjtUI.isClickable(evt)) return;
            if (!(touched)) startpress(evt,holdthresh);
            noDefault(evt);}

        function taphold_up(evt){
            evt=evt||event;
            mouse_down=false;
            if (cleared>start_t) {
                abortpress(evt,"up");
                return;}
            var target=fdjtUI.T(evt);
            var holder=getParent(target,".tapholder");
            if (holder!==elt) {
                if ((th.trace)||(trace_taphold))
                    fdjtLog("TapHold/up/ignore(%d) %o tht=%o target=%o holder=%o elt=%o",
                            serial,evt,th_target,target,holder,elt);
                return;}
            if (target) target=getParent(target,touchable);
            touch_x=evt.clientX||getClientX(evt)||touch_x;
            touch_y=evt.clientY||getClientY(evt)||touch_y;
            touch_t=fdjtTime();
            if (!(target)) target=getRealTarget(elt,touchable,touch_x,touch_y);
            if ((th.trace)||(trace_taphold))
                fdjtLog("TapHold/up(%d) %o tht=%o s=%o,%o,%o t=%o,%o m=%o touched=%o pressed=%o ttt=%o",
                        serial,evt,th_target,
                        start_x,start_y,start_t,touch_x,touch_y,mouse_down,
                        touched,pressed,
                        taptapthresh||false);
            if ((evt.touches)&&(evt.touches.length)&&
                (evt.touches.length>1))
                return;
            if (fdjtUI.isClickable(evt)) return;
            if ((!(mouse_down))&&((touched)||(pressed))) {
                if (docancel) fdjtUI.cancel(evt);
                endpress(evt,taptapthresh);}
            else {}
            start_x=start_y=start_t=touch_x=touch_y=touch_t=false;}

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
        addClass(elt,"tapholder");

        if (!(fortouch)) fdjtDOM.addListener(elt,"mousemove",taphold_move);
        fdjtDOM.addListener(elt,"touchmove",taphold_move);
        if (!(fortouch)) fdjtDOM.addListener(elt,"mousedown",taphold_down);
        if (!(fortouch)) fdjtDOM.addListener(elt,"mouseout",taphold_mouseout);
        if (!(fortouch)) fdjtDOM.addListener(elt,"mouseover",taphold_mouseover);
        fdjtDOM.addListener(elt,"touchstart",taphold_down);
        if (!(fortouch)) fdjtDOM.addListener(elt,"mouseup",taphold_up);
        // fdjtDOM.addListener(elt,"click",taphold_click);
        fdjtDOM.addListener(elt,"touchend",taphold_up);
        fdjtDOM.addListener(elt,"touchcancel",abortpress);        
        if (!(window_setup)) {
            fdjtDOM.addListener(window,"mousedown",global_mousedown);
            fdjtDOM.addListener(window,"mouseup",global_mouseup);
            fdjtDOM.addListener(window,"mouseout",global_mouseout);
            // fdjtDOM.addListener(document,"keydown",taphold_keydown);
            // fdjtDOM.addListener(document,"keyup",taphold_keyup);
            window_setup=window;}

        this.elt=elt;
        this.serial=serial;
        this.ispressed=function(){return (pressed);};
        this.ispressed=function(){return (pressed);};
        this.clear=function(){
            if (pressed) slipped(pressed);
            touched=pressed=tap_target=false;
            touch_t=touch_x=start_x=touch_y=start_y=start_t=false;
            if (th_timer) {clearTimeout(th_timer); th_timer=false;}
            setTarget(false);
            th_targets=[];};
        this.fakePress=function fakePress(evt,holdthresh){
            start_x=touch_x=evt.clientX||getClientX(evt);
            start_y=touch_y=evt.clientY||getClientY(evt);
            touch_t=start_t=fdjtET();
            var target=document.elementFromPoint(start_x,start_y);
            if (!(target))
                fdjtLog("TapHold(%d): No target from %o,%o",
                        serial,start_x,start_y);
            setTarget(target); th_targets=[target];
            if ((th.trace)||(trace_taphold))
                fdjtLog("TapHold/fakePress(%d) t=%o x=%o y=%o t=%o",
                        serial,th_target,start_x,start_y,start_t);
            startpress(evt,holdthresh);};

        if (trace_taphold)
            fdjtLog("TapHold listener (#%d) for %o",serial,elt);
        
        return this;}

    TapHold.clear=function(){
        if (trace_taphold) fdjtLog("TapHold.clear()");
        cleared=fdjtET();};

    TapHold.Trace=function(flag){
        if (typeof flag === "undefined")
            trace_taphold=(!(trace_taphold));
        else trace_taphold=flag;};

    return TapHold;})();


/* Emacs local variables
   ;;;  Local variables: ***
   ;;;  compile-command: "make; if test -f ../makefile; then cd ..; make; fi" ***
   ;;;  indent-tabs-mode: nil ***
   ;;;  End: ***
*/
