/* -*- Mode: Javascript; -*- */

/* ######################### fdjt/ui.js ###################### */

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
if (!(fdjt.UI)) fdjt.UI={};
if (!(fdjt.UI.CoHi)) fdjt.UI.CoHi={classname: "cohi"};
if (!(fdjt.UI.AutoPrompt)) fdjt.UI.AutoPrompt={};
if (!(fdjt.UI.InputHelp)) fdjt.UI.InputHelp={};
if (!(fdjt.UI.Ellipsis)) fdjt.UI.Ellipsis={};
if (!(fdjt.UI.Expansion)) fdjt.UI.Expansion={};
if (!(fdjt.UI.Collapsible)) fdjt.UI.Collapsible={};
if (!(fdjt.UI.Tabs)) fdjt.UI.Tabs={};
if (!(fdjt.UI.MultiText)) fdjt.UI.MultiText={};
if (!(fdjt.UI.Reticle)) fdjt.UI.Reticle={};
if (!(fdjt.UI.FocusBox)) fdjt.UI.FocusBox={};

/* Co-highlighting */

/* When the mouse moves over a named element, the 'cohi' class is added to
   all elements with the same name. */

(function(){
    "use strict";
    var fdjtDOM=fdjt.DOM;
    var fdjtUI=fdjt.UI;

    var highlights={};
    function highlight(namearg,classname_arg){
        var classname=((classname_arg) || (fdjtUI.CoHi.classname));
        var newname=(namearg.name)||(namearg);
        var cur=highlights[classname];
        var i, n;
        if (cur===newname) return;
        if (cur) {
            var drop=document.getElementsByName(cur);
            i=0; n=drop.length;
            while (i<n) fdjtDOM.dropClass(drop[i++],classname);}
        highlights[classname]=newname||false;
        if (newname) {
            var elts=document.getElementsByName(newname);
            n=elts.length; i=0;
            while (i<n) fdjtDOM.addClass(elts[i++],classname);}}
    fdjtUI.CoHi.highlight=highlight;
    
    fdjtUI.CoHi.onmouseover=function cohi_onmouseover(evt,classname_arg){
        var target=fdjtDOM.T(evt);
        while (target) {
            if (target.nodeType===3) target=target.parentNode;
            else if (target.nodeType!==1) {target=false; break;}
            if ((target.tagName==='INPUT') || (target.tagName==='TEXTAREA') ||
                ((target.tagName==='A') && (target.href)))
                return;
            else if ((target.name)||(target.getAttribute("name")))
                break;  
            else target=target.parentNode;}
        if (!(target)) return;
        highlight(target.name||target.getAttribute("name"),classname_arg);};
    fdjtUI.CoHi.onmouseout=function cohi_onmouseout(evt,classname_arg){
        highlight(false,((classname_arg) || (fdjtUI.CoHi.classname)));};
})();


/* Text highlighting */

fdjt.UI.Highlight=(function(){
    "use strict";
    var fdjtDOM=fdjt.DOM;

    var highlight_class="fdjthighlight";
    var hasClass=fdjtDOM.hasClass;
    var hasParent=fdjtDOM.getParent;
    var getStyle=fdjtDOM.getStyle;

    function textnode(s){
        return document.createTextNode(s);}

    function gatherHighlights(node,classpat,into){
        if (node.nodeType!==1) return;
        if (node.childNodes) {
            var children=node.childNodes;
            var i=0, lim=children.length;
            while (i<lim) gatherHighlights(children[i++],classpat,into);}
        if ((node.className)&&(node.className.search)&&
            (node.className.search(classpat)>=0)) {
            into.push(node);}}

    function unwrap_hnode(hnode){
        var ch=hnode.childNodes;
        if (ch) {
            var frag=document.createDocumentFragment();
            var tomove=[], j=0, n=((ch)&&(ch.length));
            while (j<n) tomove.push(ch[j++]);
            j=0; n=tomove.length;
            while (j<n) frag.appendChild(tomove[j++]);
            fdjtDOM.replace(hnode,frag);}
        else fdjtDOM.remove(hnode);}
    
    function clear_highlights(node,hclass){
        var h=[];
        if ((node===hclass)||(hasClass(node,hclass))) h=[node];
        else gatherHighlights(node,new RegExp("\\b"+hclass+"\\b","g"),h);
        var i=0 , lim=h.length;
        while (i<lim) unwrap_hnode(h[i++]);}

    function highlight_node(node,hclass,htitle,hattribs){
        if (!(hclass)) hclass=highlight_class;
        var hispan=false;
        if (node.nodeType===3) {
            var text=node.nodeValue;
            if (text.search(/\S/g)>=0)
                hispan=fdjtDOM("span."+hclass);
            else {
                var parent=node.parentNode, style=getStyle(parent);
                var next=node.nextSibling, prev=node.prevSibling;
                var nstyle=next&&(next.nodeType===1)&&getStyle(next);
                var pstyle=prev&&(prev.nodeType===1)&&getStyle(prev);
                var ndisplay=nstyle&&nstyle.display;
                var pdisplay=pstyle&&pstyle.display;
                if (style.whiteSpace!=='normal')
                    hispan=fdjtDOM("span."+hclass);
                else if (!((next)||(prev)))
                    hispan=fdjtDOM("span."+hclass);
                else if ((!((ndisplay==='inline')||(ndisplay==='table-cell')))&&
                         (!((pdisplay==='inline')||(pdisplay==='table-cell'))))
                    hispan=false;
                else hispan=fdjtDOM("span."+hclass);}}
        else if ((node.nodeType!==1)||(hasClass(node,hclass)))
            return node;
        else if (hasClass(node,"fdjtskiptext")) {}
        else {
            var nodestyle=getStyle(node);
            var display=nodestyle.display;
            var position=nodestyle.position;
            if ((position!=="static")&&(position!=="")) {}
            else if (display==="block")
                hispan=(fdjtDOM("div."+hclass));
            else if (display==="inline")
                hispan=fdjtDOM("span."+hclass);
            else {}}
        if (!(hispan)) return node;
        if (htitle) hispan.title=htitle;
        if (hattribs) {
            for (var attrib in hattribs) {
                if (hattribs.hasOwnProperty(attrib))
                    hispan.setAttribute(attrib,hattribs[attrib]);}}
        fdjtDOM.replace(node,hispan);
        hispan.appendChild(node);
        return hispan;}
    function highlight_text(text,hclass,htitle,hattribs){
        var tnode=fdjtDOM("span."+(hclass||highlight_class),text);
        if (htitle) tnode.title=htitle;
        if (hattribs) {
            for (var attrib in hattribs) {
                if (hattribs.hasOwnProperty(attrib))
                    tnode.setAttribute(attrib,hattribs[attrib]);}}
        return tnode;}
    function highlight_node_range(node,start,end,hclass,htitle,hattribs){
        var stringval=node.nodeValue;
        var parent=node.parentNode;
        if ((end===false)||(typeof end === 'undefined'))
            end=stringval.length;
        if (start===end) return;
        var beginning=((start>0)&&(textnode(stringval.slice(0,start))));
        var middle=highlight_text(
            stringval.slice(start,end),hclass,htitle,hattribs);
        var ending=((end<stringval.length)&&
                    (textnode(stringval.slice(end))));
        if ((beginning)&&(ending)) {
            parent.replaceChild(ending,node);
            parent.insertBefore(middle,ending);
            parent.insertBefore(beginning,middle);}
        else if (beginning) {
            parent.replaceChild(middle,node);
            parent.insertBefore(beginning,middle);}
        else if (ending) {
            parent.replaceChild(ending,node);
            parent.insertBefore(middle,ending);}
        else parent.replaceChild(middle,node);
        return middle;}
    function highlight_range(range,hclass,htitle,hattribs){
        range=fdjtDOM.refineRange(range);
        var starts_in=range.startContainer;
        var ends_in=range.endContainer;
        if (starts_in===ends_in)
            return [highlight_node_range(
                starts_in,range.startOffset,range.endOffset,
                hclass,htitle,hattribs)];
        else {
            var highlights=[];
            var scan=starts_in;
            while ((scan)&&(!(scan.nextSibling)))
                scan=scan.parentNode;
            scan=scan.nextSibling;
            while (scan) {
                if (scan===ends_in) break;
                else if (hasParent(ends_in,scan))
                    scan=scan.firstChild;
                else {
                    var next=scan;
                    while ((next)&&(!(next.nextSibling)))
                        next=next.parentNode;
                    next=next.nextSibling;
                    highlights.push(
                        highlight_node(scan,hclass,htitle,hattribs));
                    scan=next;}}
            // Do the ends
            highlights.push(
                highlight_node_range(
                    starts_in,range.startOffset,false,hclass,htitle,hattribs));
            highlights.push(
                highlight_node_range(
                    ends_in,0,range.endOffset,hclass,htitle,hattribs));
            return highlights;}}

    highlight_range.clear=clear_highlights;
    highlight_range.remove=unwrap_hnode;
    highlight_range.highlight=highlight_range;
    return highlight_range;})();



/* CheckSpans:
   Text regions which include a checkbox where clicking toggles the checkbox. */

(function(){
    "use strict";
    var fdjtDOM=fdjt.DOM;
    var fdjtUI=fdjt.UI;
    var fdjtID=fdjt.ID;

    var hasClass=fdjtDOM.hasClass;
    var addClass=fdjtDOM.addClass;
    var dropClass=fdjtDOM.dropClass;
    var getParent=fdjtDOM.getParent;
    var getChildren=fdjtDOM.getChildren;

    function CheckSpan(spec,varname,val,checked){
        var input=fdjtDOM.Input('input[type=checkbox]',varname,val);
        var span=fdjtDOM(spec||"span.checkspan",input);
        if (checked) {
            input.checked=true;
            fdjtDOM.addClass(span,"ischecked");}
        else input.checked=false;
        if (arguments.length>4) 
            fdjtDOM.appendArray(span,arguments,4);
        return span;}
    fdjtUI.CheckSpan=CheckSpan;
    CheckSpan.useEvent = false;

    function checkable(elt){
        return (elt.nodeType===1)&&
            (elt.tagName==='INPUT')&&
            ((elt.type==='checkbox')||(elt.type==='radio'));}
    function getcheckable(elt){
        if (checkable(elt)) return elt;
        var cb=getParent(elt,checkable);
        if (cb) return cb;
        cb=getChildren(elt,'input');
        if (cb.length) {
            var i=0; var lim=cb.length;
            while (i<lim)
                if (checkable(cb[i])) return cb[i]; else i++;
            return false;}
        else return false;}

    function checkspan_set(target,checked) {
        var i, lim;
        if (typeof target === 'string') target=fdjtID(target);
        else if (target.length) {
            i=0; lim=target.length;
            while (i<lim) checkspan_set(target[i++],checked);
            return;}
        if ((!(target))||(!(target.nodeType))) return;
        var checkspan=((hasClass(target,"checkspan"))?(target):
                       (getParent(target,".checkspan")));
        if (!(checkspan)) return false;
        var checkbox=((checkable(target))&&(target))||
            (getcheckable(target))||
            (getcheckable(checkspan));
        if (!(checkbox)) return false;
        if (hasClass(checkspan,"isdisabled")) {
            if (checkbox.disabled) return false;
            else dropClass(checkspan,"isdisabled");}
        else if (checkbox.disabled) {
            addClass(checkspan,"isdisabled");
            return false;}
        var ischecked=hasClass(checkspan,"ischecked");
        var changed=false; var unchecked=[];
        if (typeof checked === 'undefined') checked=ischecked;
        if (checkbox.checked!==checked) {
            checkbox.checked=checked; changed=true;}
        // If the checkspan is inconsistent, the checkbox was probably
        // just changed
        else if (ischecked!==checkbox.checked) changed=true;
        else {}
        // We change this anyway, just in case there's been a glitch
        if (checked) addClass(checkspan,"ischecked");
        else dropClass(checkspan,"ischecked");
        if ((changed)&&(checkbox.type==='radio')) {
            var form=checkbox.form;
            if (!(form)) form=getParent(checkbox,".fdjtinputs");
            if (!(form)) form=checkspan.parentNode;
            var name=checkbox.name;
            var tosync=getChildren(form,'input');
            i=0; lim=tosync.length;
            while (i<lim) {
                var input=tosync[i++];
                if (input===checkbox) continue;
                else if ((input.type==='radio')&&
                         (input.name===name)) {
                    var cspan=getParent(input,".checkspan");
                    if (cspan===checkspan) continue;
                    else if (hasClass(cspan,"ischecked"))
                        if (!(input.checked)) unchecked.push(input);}
                else {}}}
        var evt;
        if (changed) {
            evt=document.createEvent("HTMLEvents");
            evt.initEvent("change",false,true);
            checkbox.dispatchEvent(evt);}
        if (unchecked.length) {
            i=0; lim=unchecked.length;
            while (i<lim) {
                var uncheck=unchecked[i++];
                var altspan=getParent(uncheck,".checkspan");
                dropClass(altspan,"ischecked");
                evt=document.createEvent("HTMLEvents");
                evt.initEvent("change",false,true);
                uncheck.dispatchEvent(evt);}}}
    fdjtUI.CheckSpan.set=checkspan_set;

    function checkspan_onclick(evt) {
        evt=evt||window.event;
        var target=evt.target||evt.srcTarget;
        if ((target.tagName==='TEXTAREA')||
            (target.tagName==='SELECT')||
            (target.tagName==='OPTION')||
            ((target.tagName==='INPUT')&&
             (!((target.type==='checkbox')||
                (target.type==='radio')))))
            return;
        var anchor=((target.tagName==='A')?(target):
                    (getParent(target,'A')));
        if ((anchor)&&(anchor.href)) return;
        var checkspan=getParent(target,".checkspan");
        if (!(checkspan)) return;
        var checked=hasClass(checkspan,"ischecked");
        checkspan_set(target,(!(checked)));
        return false;}
    fdjtUI.CheckSpan.onclick=checkspan_onclick;    

    function changed(evt) {
        evt=evt||window.event;
        var target=fdjtUI.T(evt);
        if ((target.type==='radio')||(target.type==='checkbox')) {
            var checkspan=getParent(target,'.checkspan');
            if (checkspan)
                ((target.checked)?(addClass):(dropClass))(
                    checkspan,"ischecked");}
        if (target.type==='radio') {
            var form=target.form;
            var others=document.getElementsByName(target.name);
            var i=0, lim=others.length;
            while (i<lim) {
                var other=others[i++];
                if (other===target) continue;
                else if (other.form!==form) continue;
                else if (other.type !== 'radio') continue;
                var ocs=fdjtDOM.getParent(other,'.checkspan');
                dropClass(ocs,"ischecked");}}}
    fdjtUI.CheckSpan.changed=changed;

    function initCheckspans(){
        var checkspans=fdjt.$(".checkspan");
        var i=0, lim=checkspans.length;
        while (i<lim) {
            var checkspan=checkspans[i++];
            var inputs=fdjtDOM.getInputs(checkspan);
            var j=0, jlim=inputs.length;
            while (j<jlim) {
                var input=inputs[j++];
                if ((input.type==='radio')||(input.type==='checkbox')) {
                    if (input.checked) addClass(checkspan,"ischecked");
                    if (input.disabled) addClass(checkspan,"isdisabled");
                    if (fdjtDOM.hasParent(checkspan,".autosetup"))
                        fdjtDOM.addListener(checkspan,"click",checkspan_onclick);
                    break;}}}}
    fdjtUI.CheckSpan.initCheckspans=initCheckspans;

    fdjt.addInit(initCheckspans,"CheckSpans",false);

})();


/* Progress boxes */

fdjt.UI.ProgressBar=(function(){
    "use strict";
    var fdjtDOM=fdjt.DOM;
    function ProgressBar(arg){
        if (typeof arg==='undefined')
            arg=fdjtDOM("div.fdjtprogress",
                        fdjtDOM("div.indicator"),fdjtDOM("div.message"));
        else if (typeof arg==='string')
            arg=fdjtDOM("div.fdjtprogress",
                        fdjtDOM("HR"),fdjtDOM("div.message",arg));
        this.dom=arg;
        return this;}

    function setProgress(pb,progress,total){
        if (typeof pb==='string')
            pb=document.getElementById(pb);
        if (typeof total==='number')
            progress=100*(progress/total);
        if (!(pb)) return;
        var dom=((pb.dom)||(pb));
        if (!(dom.nodeType)) return;
        var rule=fdjtDOM.getChildren(dom,"div.indicator")[0];
        rule.style.width=progress+"%";}
    function setMessage(pb){
        if (typeof pb==='string')
            pb=document.getElementById(pb);
        if (!(pb)) return;
        var dom=((pb.dom)||(pb));
        if (!(dom.nodeType)) return;
        var oldmsg=fdjtDOM.getChildren(dom,".message")[0];
        var newmsg=fdjtDOM("div.message");
        fdjtDOM.appendArray(newmsg,fdjtDOM.Array(arguments,1));
        dom.replaceChild(newmsg,oldmsg);}
    
    ProgressBar.setProgress=setProgress;
    ProgressBar.setMessage=setMessage;
    ProgressBar.prototype.setProgress=function(progress,total){
        setProgress(this.dom,progress,total);};
    ProgressBar.prototype.setMessage=function(){
        var dom=this.dom;
        var oldmsg=fdjtDOM.getChildren(dom,".message")[0];
        var newmsg=fdjtDOM("div.message");
        fdjtDOM.appendArray(newmsg,fdjtDOM.Array(arguments));
        dom.replaceChild(newmsg,oldmsg);};

    return ProgressBar;})();


/* Automatic help display on focus */

(function(){
    "use strict";

    var fdjtString=fdjt.String;
    var fdjtDOM=fdjt.DOM;
    var fdjtID=fdjt.ID;

    var hasClass=fdjtDOM.hasClass;
    var addClass=fdjtDOM.addClass;
    var dropClass=fdjtDOM.dropClass;

    function show_help_onfocus(evt){
        var target=fdjtDOM.T(evt);
        while (target)
            if ((target.nodeType===1) &&
                ((target.tagName === 'INPUT') ||
                 (target.tagName === 'TEXTAREA')) &&
                (target.getAttribute('helptext'))) {
                var helptext=fdjtID(target.getAttribute('helptext'));
                if (helptext) fdjtDOM.addClass(helptext,"showhelp");
                return;}
        else target=target.parentNode;}
    function autoprompt_onfocus(evt){
        evt=evt||window.event||null;
        var elt=fdjtDOM.T(evt);
        if ((elt) && (hasClass(elt,'isempty'))) {
            elt.value=''; dropClass(elt,'isempty');}
        show_help_onfocus(evt);}

    function hide_help_onblur(evt){
        var target=fdjtDOM.T(evt);
        while (target)
            if ((target.nodeType===1) &&
                ((target.tagName === 'INPUT') || 
                 (target.tagName === 'TEXTAREA')) &&
                (target.getAttribute('HELPTEXT'))) {
                var helptext=fdjtID(target.getAttribute('HELPTEXT'));
                if (helptext) dropClass(helptext,"showhelp");
                return;}
        else target=target.parentNode;}
    function autoprompt_onblur(evt){
        var elt=fdjtDOM.T(evt);
        if (elt.value==='') {
            addClass(elt,'isempty');
            var prompt=(elt.prompt)||(elt.getAttribute('prompt'))||(elt.title);
            if (prompt) elt.value=prompt;}
        else dropClass(elt,'isempty');
        hide_help_onblur(evt);}
    
    // Removes autoprompt text from empty fields
    function autoprompt_cleanup(form) {
        var elements=fdjtDOM.getChildren(form,".isempty");
        if (elements) {
            var i=0; var lim=elements.length;
            while (i<lim) elements[i++].value="";}}
    function autoprompt_onsubmit(evt) {
        var form=fdjtDOM.T(evt);
        autoprompt_cleanup(form);}

    var isEmpty=fdjtString.isEmpty;
    // Adds autoprompt handlers to autoprompt classes
    function autoprompt_setup(arg,nohandlers) {
        var forms=
            ((arg.tagName==="FORM")?[arg]:
             (fdjtDOM.getChildren(arg||document.body,"FORM")));
        var i=0; var lim=forms.length;
        while (i<lim) {
            var form=forms[i++];
            var inputs=fdjtDOM.getChildren
            (form,"INPUT.autoprompt,TEXTAREA.autoprompt");
            if (inputs.length) {
                var j=0; var jlim=inputs.length;
                while (j<jlim) {
                    var input=inputs[j++];
                    input.blur();
                    if (isEmpty(input.value)) {
                        addClass(input,"isempty");
                        var prompt=(input.prompt)||
                            (input.getAttribute('prompt'))||(input.title);
                        if (prompt) input.value=prompt;}
                    if (!(nohandlers)) {
                        fdjtDOM.addListener(input,"focus",autoprompt_onfocus);
                        fdjtDOM.addListener(input,"blur",autoprompt_onblur);}}
                if (!(nohandlers))
                    fdjtDOM.addListener(form,"submit",autoprompt_onsubmit);}}}
    
    fdjt.UI.AutoPrompt.setup=autoprompt_setup;
    fdjt.UI.AutoPrompt.onfocus=autoprompt_onfocus;
    fdjt.UI.AutoPrompt.onblur=autoprompt_onblur;
    fdjt.UI.AutoPrompt.onsubmit=autoprompt_onsubmit;
    fdjt.UI.AutoPrompt.cleanup=autoprompt_cleanup;
    fdjt.UI.InputHelp.onfocus=show_help_onfocus;
    fdjt.UI.InputHelp.onblur=hide_help_onblur;})();

/* Automatic classes for focused children */

(function(){
    "use strict";
    var fdjtDOM=fdjt.DOM, fdjtUI=fdjt.UI;
    var addListener=fdjtDOM.addListener;
    function fdjt_focusin(evt){
        var scan=fdjtUI.T(evt), add=[]; 
        if ((scan.tagName==='TEXTAREA')||
            ((scan.tagName==='INPUT')&&
             (/text|email/i.exec(scan.type)))) {
            while (scan) {
                var classname=scan.className;
                if ((classname)&&(typeof classname === "string")&&
                    (classname.search(/\bfdjtfoci\b/)>=0)&&
                    (classname.search(/\bfdjtfocus\b/)<0))
                    add.push(scan);
                scan=scan.parentNode;}
            if (add.length) 
                setTimeout(function(){
                    var i=0; while (i<add.length) {
                        var elt=add[i++], classname=elt.className;
                        elt.className=classname+" fdjtfocus";}},
                           300);}}
    fdjtUI.focusin=fdjt_focusin;
    addListener(window,"focusin",fdjt_focusin);
    function fdjt_focusout(evt){
        var scan=fdjtUI.T(evt), drop=[];
        if ((scan.tagName==='TEXTAREA')||
            ((scan.tagName==='INPUT')&&
             (/text|email/i.exec(scan.type)))) {
            while (scan) {
                var classname=scan.className;
                if ((classname)&&(typeof classname === "string")&&
                    (classname.search(/\bfdjtfocus\b/)>=0))
                    drop.push(scan);
                scan=scan.parentNode;}
            if (drop.length) 
                setTimeout(function(){
                    var i=0; while (i<drop.length) {
                        var elt=drop[i++], classname=elt.className;
                        elt.className=classname.replace(/ fdjtfocus\b/,"");}},
                           300);}}
    fdjtUI.focusout=fdjt_focusout;
    addListener(window,"focusout",fdjt_focusout);
})();

/* Text input boxes which create checkspans on enter. */

(function(){
    "use strict";
    var fdjtDOM=fdjt.DOM;
    var fdjtUI=fdjt.UI;
    var fdjtString=fdjt.String;
    var isEmpty=fdjtString.isEmpty;
    var hasClass=fdjtDOM.hasClass;

    function multitext_keypress(evt,sepchars,sepexp,fn){
        // sepchars are characters which function just like 'Return'
        // sepexp is a regular expression which is used to split an
        //   input string into multiple values
        evt=(evt)||(event);
        var chcode=evt.charCode, ch=String.fromCharCode(chcode);
        var target=fdjtUI.T(evt);
        if  (sepchars instanceof RegExp) {
            sepexp=sepchars; sepchars=false;}
        else if ((sepchars)&&(sepchars.call)) {
            fn=sepchars; sepchars=false;}
        else {}
        if ((!sepchars)&&(target.getAttribute("data-sepchars")))
            sepchars=target.getAttribute("data-sepchars");
        if ((chcode===13)&&(isEmpty(target.value))&&
            (hasClass(target,"fdjtentersubmit"))) {
            fdjt.UI.cancel(evt);
            target.form.submit();
            return;}
        if ((chcode===13)||
            ((sepchars)&&((sepchars.indexOf(ch))>=0))) {
            if ((!(sepexp))&&(target.getAttribute("data-separator")))
                sepexp=new RegExp(target.getAttribute("data-separator"),"g");
            var checkspec=
                target.getAttribute("data-checkspec")||"div.checkspan";
            var values=((sepexp)?(target.value.split(sepexp)):[target.value]);
            var i=0, lim=values.length; while (i<lim) {
                var value=values[i++];
                if (fn)
                    fdjtDOM(target.parentNode,"\n",fn(target.name,value));
                else {
                    var checkbox=
                        fdjtDOM.Input("[type='checkbox']",target.name,value);
                    var checkelt=fdjtDOM(checkspec,checkbox,value);
                    checkbox.checked=true;
                    fdjtDOM.addClass(checkelt,"ischecked");
                    fdjtDOM(target.parentNode,"\n",checkelt);}}
            fdjtUI.cancel(evt);
            target.value='';}}
    fdjtUI.MultiText.keypress=multitext_keypress;})();


/* Tabs */

(function(){
    "use strict";
    var fdjtDOM=fdjt.DOM;
    var fdjtLog=fdjt.Log;
    var fdjtState=fdjt.State;
    var fdjtUI=fdjt.UI;
    var fdjtID=fdjt.ID;

    var hasClass=fdjtDOM.hasClass;
    var addClass=fdjtDOM.addClass;
    var dropClass=fdjtDOM.dropClass;
    
    function tab_onclick(evt,shownclass){
        var elt=fdjtUI.T(evt);
        if (!(shownclass)) {
            shownclass=
                fdjtDOM.findAttrib(elt,"shownclass","http://fdjt.org/")||
                "fdjtshown";}
        if (elt) {
            var content_id=false;
            while (elt.parentNode) {
                if ((content_id=fdjtDOM.getAttrib(elt,"contentid"))) break;
                else elt=elt.parentNode;}
            if (!(content_id)) return;
            var content=document.getElementById(content_id);
            var parent=fdjtDOM.getParent(elt,".tabs")||elt.parentNode;
            var sibs=fdjtDOM.getChildren(parent,".tab")||parent.childNodes;
            if (content===null) {
                fdjtLog("No content for "+content_id);
                return;}
            var i=0; while (i<sibs.length) {
                var node=sibs[i++]; var cid;
                if ((node.nodeType===1) &&
                    (cid=fdjtDOM.getAttrib(node,"contentid"))) {
                    if (!(cid)) continue;
                    var cdoc=document.getElementById(cid);
                    if (node===elt) {}
                    else if (hasClass(node,shownclass)) {
                        dropClass(node,shownclass);
                        if (cdoc) dropClass(cdoc,shownclass);}}}
            if (hasClass(elt,shownclass)) {
                dropClass(elt,shownclass);
                dropClass(content,shownclass);}
            else {
                addClass(elt,shownclass);
                addClass(content,shownclass);}
            var tabstate=fdjtDOM.findAttrib(elt,'tabstate');
            if (!(tabstate)) {}
            else if (tabstate==='#') {
                var scrollstate={};
                fdjtUI.scrollSave(scrollstate);
                document.location.hash=tabstate+content_id;
                fdjtUI.scrollRestore(scrollstate);}
            else fdjtState.setCookie(tabstate,content_id);
            // This lets forms pass tab information along
            return false;}}
    fdjtUI.Tabs.click=tab_onclick;
    
    function select_tab(tabbar,contentid,shownclass){
        if (!(shownclass)) {
            shownclass=
                fdjtDOM.findAttrib(tabbar,"shownclass","http://fdjt.org/")||
                "fdjtshown";}
        var tabseen=false;
        var tabs=fdjtDOM.getChildren(tabbar,".tab");
        var i=0; while (i<tabs.length) {
            var tab=tabs[i++];
            if ((tab.getAttribute("contentid"))===contentid) {
                addClass(tab,shownclass); tabseen=true;}
            else if (hasClass(tab,shownclass)) {
                dropClass(tab,shownclass);
                var cid=fdjtDOM.getAttrib(tab,"contentid");
                var content=(cid)&&fdjtID(cid);
                if (!(content))
                    fdjtLog.warn("No reference for tab content %o",cid);
                else dropClass(content,shownclass);}
            else dropClass(tab,shownclass);}
        if (fdjtID(contentid)) {
            if (tabseen) addClass(contentid,shownclass);
            else fdjtLog.warn("a tab for %s was not found in %o",
                              contentid,tabbar);}
        else fdjtLog.warn("No reference for tab content %o",contentid);}
    fdjtUI.Tabs.selectTab=select_tab;
    
    function setupTabs(elt){
        if (!(elt)) elt=fdjtDOM.$(".tabs[tabstate]");
        else if (typeof elt === 'string') elt=fdjtID(elt);
        if ((!(elt))||(!(elt.getAttribute("tabstate")))) return;
        var tabstate=elt.getAttribute("tabstate");
        var content_id=false;
        if (tabstate==='#') {
            content_id=document.location.hash;
            if (content_id[0]==='#') content_id=content_id.slice(1);
            var content=((content_id)&&(fdjtID(content_id)));
            if (!(content)) return;
            var ss={}; fdjtUI.scrollSave(ss);
            window.scrollTo(0,0);
            if (!(fdjtDOM.isVisible(content)))
                fdjtUI.scrollRestore(ss);}
        else content_id=fdjtState.getQuery(tabstate)||
            fdjtState.getCookie(tabstate);
        if (!(content_id)) return;
        if (content_id[0]==='#') content_id=content_id.slice(1);
        if (content_id) select_tab(elt,content_id);}
    fdjtUI.Tabs.setup=setupTabs;
    
    function selected_tab(tabbar){
        var tabs=fdjtDOM.getChildren(tabbar,".tab");
        var i=0; while (i<tabs.length) {
            var tab=tabs[i++];
            if (hasClass(tab,"shown"))
                return tab.getAttribute("contentid");}
        return false;}
    fdjtUI.Tabs.getSelected=selected_tab;}());



/* Collapse/Expand */

(function(){
    "use strict";
    var fdjtDOM=fdjt.DOM;
    var fdjtUI=fdjt.UI;

   fdjtUI.Expansion.toggle=function(evt,spec,exspec){
        evt=evt||window.event;
        var target=fdjtUI.T(evt);
        var wrapper=fdjtDOM.getParent(target,spec||".fdjtexpands");
        if (wrapper) fdjtDOM.toggleClass(wrapper,exspec||"fdjtexpanded");};
    fdjtUI.Expansion.onclick=fdjtUI.Expansion.toggle;

    fdjtUI.Collapsible.click=function(evt){
        evt=evt||window.event;
        var target=fdjtUI.T(evt);
        if (fdjtUI.isDefaultClickable(target)) return;
        var wrapper=fdjtDOM.getParent(target,".collapsible");
        if (wrapper) {
            fdjtUI.cancel(evt);
            fdjtDOM.toggleClass(wrapper,"expanded");}};

    fdjtUI.Collapsible.focus=function(evt){
        evt=evt||window.event;
        var target=fdjtUI.T(evt);
        var wrapper=fdjtDOM.getParent(target,".collapsible");
        if (wrapper) {
            fdjtDOM.toggleClass(wrapper,"expanded");}};
    
    fdjtUI.toggleParent=function toggleParent(evt,spec,classname){
        var target=fdjtUI.T(evt);
        var parent=fdjtDOM.getParent(target,spec);
        if (parent) fdjtDOM.toggleClass(parent,classname);};})();


/* Temporary Scrolling */

(function(){
    "use strict";
    var fdjtDOM=fdjt.DOM;
    var fdjtUI=fdjt.UI;

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

    function scroll_into_view(elt,topedge){
        if ((topedge!==0) && (!topedge) && (fdjtDOM.isVisible(elt)))
            return;
        else if ((use_native_scroll) && (elt.scrollIntoView)) {
            elt.scrollIntoView(topedge);
            if ((topedge!==0) && (!topedge) && (fdjtDOM.isVisible(elt,true)))
                return;}
        else {
            var top = elt.offsetTop;
            var left = elt.offsetLeft;
            var height = elt.offsetHeight;
            
            while(elt.offsetParent) {
                elt = elt.offsetParent;
                top += elt.offsetTop;
                left += elt.offsetLeft;}
            
            var vh=fdjtDOM.viewHeight();
            var x=0; var y;
            var y_target=top+(height/3);
            if ((2*(height/3))<((vh/2)-50))
                y=y_target-vh/2;
            else if ((height)<(vh-100))
                y=top-(50+(height/2));
            else y=top-50;

            window.scrollTo(x,y);}}

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
        if (typeof target === 'number')
            window.scrollTo(((typeof context === 'number')&&(context))||0,target);
        else scroll_into_view(target,delta);
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

    fdjtUI.scrollSave=scroll_save;
    fdjtUI.scrollRestore=scroll_restore;
    fdjtUI.scrollIntoView=scroll_into_view;
    fdjtUI.scrollPreview=scroll_preview;
    fdjtUI.scrollRestore=scroll_restore;}());


/* Smart (DOM-aware) scrolling */

(function(){
    "use strict";
    var fdjtDOM=fdjt.DOM;

    var getGeometry=fdjtDOM.getGeometry;
    var getStyle=fdjtDOM.getStyle;

    function smartScroll(win,off,content){
        if (typeof content==='undefined') content=win;
        if (off<=0) {win.scrollTop=0; return;}
        else {
            var block=findBreak(content,off,content);
            if (!(block)) {win.scrollTop=off; return;}
            var geom=getGeometry(block,content||win);
            if ((geom-top-off)<(win.offsetTop/4))
                win.scrollTop=geom.top;
            else win.scrollTop=off;}}
    function findBreak(node,off,container){
        var style=getStyle(node);
        var display=style.display;
        if ((display==='block')||(display==='table-row')||
            (display==='list-item')||(display==='preformatted')) {
            var geom=getGeometry(node,container);
            if (geom.top>off) return node;
            else if (geom.bottom>off) {
                if (style.pageBreakInside==='avoid')
                    return node;
                var children=node.childNodes;
                var i=0, lim=children.length;
                while (i<lim)  {
                    var child=children[i++];
                    var bk=((child.nodeType===1)&&
                            (findBreak(child,off,container)));
                    if (bk) return bk;}
                return node;}
            else return false;}
        else return false;}

    fdjt.UI.smartScroll=smartScroll;})();


/* Delays */

(function(){
    "use strict";

    fdjt.UI.Delay=function(interval,name,fcn){
        setTimeout(fcn,interval);};
    fdjt.UI.Delayed=function(fcn,interval){
        if (!(interval)) interval=25;
        setTimeout(fcn,interval);};})();

/* Triggering submit events */

(function(){
    "use strict";
    var fdjtDOM=fdjt.DOM;
    var fdjtUI=fdjt.UI;

    function dosubmit(evt){
        evt=evt||window.event;
        var target=fdjtUI.T(evt);
        var form=fdjtDOM.getParent(target,"FORM");
        var submit_event = document.createEvent("HTMLEvents");
        submit_event.initEvent('submit',false,true);
        form.dispatchEvent(submit_event);
        form.submit();}
    fdjtUI.dosubmit=dosubmit;

    function forceSubmit(form){
        var submit_event = document.createEvent("HTMLEvents");
        submit_event.initEvent('submit',false,true);
        form.dispatchEvent(submit_event);}
    fdjtUI.forceSubmit=forceSubmit;

    function submitOnEnter(evt){
        evt=evt||window.event;
        var kc=evt.keyCode||evt.charCode;
        if (kc===13) {
            var target=fdjtUI.T(evt);
            var form=fdjtDOM.getParent(target,'FORM');
            var submit_event = document.createEvent("HTMLEvents");
            submit_event.initEvent('submit',false,true);
            fdjtUI.cancel(evt);
            form.dispatchEvent(submit_event);
            form.submit();}}
    fdjtUI.submitOnEnter=submitOnEnter;

    function checkFileInputs(evt){
        evt=evt||window.event;
        var form=fdjtUI.T(evt);
        var file_inputs=fdjtDOM.getInputs(form,false,"file");
        var i=0, lim=file_inputs.length; while (i<lim) {
            var input=file_inputs[i++];
            if ((!(input.value))||(input.value==="")) {
                fdjtUI.cancel(evt);
                (fdjt.UI.alert||window.alert)("You need to specify a file!");}}}
    fdjtUI.checkFileInputs=checkFileInputs;

}());

/* Looking for vertical box overflow */

(function(){
    "use strict";
    var fdjtDOM=fdjt.DOM;
    var fdjtUI=fdjt.UI;

    var addClass=fdjtDOM.addClass;
    var dropClass=fdjtDOM.dropClass;
    var getGeometry=fdjtDOM.getGeometry;
    var getInsideBounds=fdjtDOM.getInsideBounds;
    function checkOverflow(node){
        var geom=getGeometry(node);
        var inside=getInsideBounds(node);
        if (inside.bottom>geom.bottom) addClass(node,"overflow");
        else dropClass(node,"overflow");}
    fdjtUI.Overflow=checkOverflow;}());


/* Reticle based functions */

(function() {
    "use strict";
    var fdjtDOM=fdjt.DOM;
    var fdjtLog=fdjt.Log;
    var fdjtUI=fdjt.UI;
    var device=fdjt.device;

    var vreticle=false;
    var hreticle=false;
    function setXY(x,y){
        if  (vreticle) (vreticle).style.left=x+'px';
        if  (hreticle) (hreticle).style.top=y+'px';}
    function setupReticle(){
        if (!(vreticle)) {
            vreticle=fdjtDOM("div.reticle.vertical#VRETICLE"," ");
            fdjtDOM.prepend(document.body,vreticle);}
        if (!(hreticle)) {
            hreticle=fdjtDOM("div.reticle.horizontal#HRETICLE"," ");
            fdjtDOM.prepend(document.body,hreticle);}
        fdjtLog("Setting up reticle");
        if (device.touch)
            fdjtDOM.addListener(document.body,"touchmove",touchmove);
        else fdjtDOM.addListener(document,"mousemove",mousemove);
        fdjtDOM.addListener(document.body,"touchmove",touchmove);
        fdjtDOM.addListener(document,"click",doflash);
        fdjtUI.Reticle.live=true;}
    
    function doflash(){flash();}

    function mousemove(evt,x,y){
        setXY(x||evt.clientX,y||evt.clientY);}
    function touchmove(evt,x,y,touch){
        if (evt.touches) touch=evt.touches[0];
        else touch=evt;
        // fdjtLog("touchmove %o: %o",evt,touch);
        setXY(x||touch.clientX,y||touch.clientY);}
    
    var highlighted=false;
    
    function highlight(flag){
        if (typeof flag === 'undefined') flag=(!(highlighted));
        if (flag) {
            if (vreticle) fdjtDOM.addClass(vreticle,"highlight");
            if (hreticle) fdjtDOM.addClass(hreticle,"highlight");
            highlighted=true;}
        else {
            if (vreticle) fdjtDOM.dropClass(vreticle,"highlight");
            if (hreticle) fdjtDOM.dropClass(hreticle,"highlight");
            highlighted=false;}}
    
    function flash(howlong){
        if (typeof howlong === 'undefined') howlong=1500;
        if (highlighted) return;
        else {
            highlight(true);
            setTimeout(function(){highlight(false);},howlong);}}

    fdjtUI.Reticle.setup=setupReticle;
    fdjtUI.Reticle.highlight=highlight;
    fdjtUI.Reticle.flash=flash;
    fdjtUI.Reticle.onmousemove=mousemove;
    fdjtUI.Reticle.ontouchmove=touchmove;
    fdjtUI.Reticle.onmove=((device.touch)?(touchmove):(mousemove));
    fdjtUI.Reticle.setXY=setXY;
    fdjtUI.Reticle.visible=false;
    fdjtUI.Reticle.live=false;})();


/* File uploader affirmation handling */

(function(){
    "use strict";
    var fdjtDOM=fdjt.DOM;
    var fdjtUI=fdjt.UI;

    fdjtUI.uploadSpecified=function(evt){
        evt=evt||window.event;
        var parent=fdjtDOM.getParent(fdjtUI.T(evt),'.fileuploader');
        if (parent) fdjtDOM.addClass(parent,'inuse');};})();


/* Image swapping */

(function(){
    "use strict";
    var fdjtUI=fdjt.UI;
    var fdjtID=fdjt.ID;
    /* global setInterval: false */

    function ImageSwap(img,interval){
        if (typeof img==='string') img=fdjtID(img);
        if (!(img)) return false;
        if (!(interval))
            interval=((img.getAttribute('data-interval'))?
                      (parseInt((img.getAttribute('data-interval')),10)):
                      (ImageSwap.interval));
        if (!(img.getAttribute("data-images"))) {
            img.setAttribute("data-images",img.src);}
        if (!(img.defaultsrc)) img.defaultsrc=img.src;
        var images=(img.getAttribute('data-images')).split('|');
        if (images.length===0) return false;
        var counter=0;
        return setInterval(function(){
            if (img.src===images[counter]) counter++;
            else img.src=images[counter++];
            if (counter>=images.length) counter=0;},
                           interval);}
            
    ImageSwap.reset=function(img){
        if (img.defaultsrc) img.src=img.defaultsrc;};
    ImageSwap.interval=1000;

    fdjtUI.ImageSwap=ImageSwap;})();


/* Miscellaneous event-related functions */

(function(){
    "use strict";
    var fdjtDOM=fdjt.DOM;
    var fdjtUI=fdjt.UI;
    var fdjtID=fdjt.ID;

    var hasClass=fdjtDOM.hasClass;
    
    fdjtUI.T=function(evt) {
        evt=evt||window.event; return (evt.target)||(evt.srcElement);};

    fdjtUI.noDefault=function noDefault(evt){
        evt=evt||window.event;
        if (evt.preventDefault) evt.preventDefault();
        else evt.returnValue=false;
        return false;};

    fdjtUI.cancelBubble=fdjtUI.noBubble=function cancelBubble(evt){
        evt=evt||window.event;
        if (evt.stopPropagation) evt.stopPropagation();
        else evt.canceBubble=true;};

    fdjtUI.cancel=function cancelEvent(evt){
        evt=evt||window.event;
        if (evt.preventDefault) evt.preventDefault();
        else evt.returnValue=false;
        if (evt.stopPropagation) evt.stopPropagation();
        else evt.cancelBubble=true;
        return false;};

    fdjtUI.isClickable=function(target){
        if ((window.Event)&&(target instanceof window.Event))
            target=fdjtUI.T(target);
        while (target) {
            if (((target.tagName==='A')&&(target.href))||
                (target.tagName==="INPUT") ||
                (target.tagName==="BUTTON") ||
                (target.tagName==="TEXTAREA") ||
                (target.tagName==="SELECT") ||
                (target.tagName==="OPTION") ||
                (hasClass(target,"checkspan"))||
                (hasClass(target,"clickable"))||
                (hasClass(target,"isclickable")))
                return true;
            else if (target.onclick)
              return true;
            else target=target.parentNode;}
        return false;};

    fdjtUI.isDefaultClickable=function(target){
        if ((window.Event)&&(target instanceof window.Event))
            target=fdjtUI.T(target);
        while (target) {
            if (((target.tagName==='A')&&(target.href))||
                (target.tagName==="INPUT") ||
                (target.tagName==="TEXTAREA") ||
                (target.tagName==="SELECT") ||
                (target.tagName==="OPTION") ||
                (hasClass(target,"isclickable")))
                return true;
            else target=target.parentNode;}
        return false;};

    function submitEvent(arg){
        var form=((arg.nodeType)?(arg):(fdjtUI.T(arg)));
        while (form) {
            if (form.tagName==='FORM') break;
            else form=form.parentNode;}
        if (!(form)) return;
        var submit_evt = document.createEvent("HTMLEvents");
        submit_evt.initEvent("submit", true, true);
        form.dispatchEvent(submit_evt);
        return;}
    fdjtUI.submitEvent=submitEvent;

    function focusEvent(arg){
        var elt=((arg.nodeType)?(arg):(fdjtUI.T(arg)));
        var focus_evt = document.createEvent("HTMLEvents");
        focus_evt.initEvent("focus", true, true);
        elt.dispatchEvent(focus_evt);
        return;}
    fdjtUI.focusEvent=focusEvent;

    function disableForm(form){
        if (typeof form === 'string') form=fdjtID(form);
        if (!(form)) return;
        var elements=fdjtDOM.getChildren(
            form,"button,input,optgroup,option,select,textarea");
        var i=0; var lim=elements.length;
        while (i<lim) elements[i++].disabled=true;}
    fdjtUI.disableForm=disableForm;
    
}());

/* Ellipsis */

(function(){
    "use strict";
    var fdjtString=fdjt.String;
    var fdjtDOM=fdjt.DOM;
    var fdjtUI=fdjt.UI;
    var fdjtID=fdjt.ID;


    var ellipsize=fdjtString.ellipsize;
    var getParent=fdjtDOM.getParent;
    var hasClass=fdjtDOM.hasClass;
    var addClass=fdjtDOM.addClass;
    var dropClass=fdjtDOM.dropClass;

    function Ellipsis(spec,string,lim,thresh,handler){
        var content=ellipsize(string,lim,thresh||0.2);
        var split=(typeof content !== "string");
        var len=string.length;
        if (!(handler)) handler=toggle;
        if ((typeof content === "string")&&(content.length===len)) {
            // No elision, just return the string
            if (spec) return fdjtDOM(spec,string);
            else return document.createTextNode(string);}
        var before=((split)?(content[0]):(content));
        var after=((split)?(content[1]):(""));
        var clen=before.length+after.length;
        var pct=Math.round((100*(clen))/len);
        if (spec) addClass(elt,"ellipsis");
        var remaining=((split)?
                       (string.slice(before.length,len-after.length)):
                       (string.slice(before.length)));
        var elided=fdjtDOM("span.elided",remaining);
        var elision=fdjtDOM(
            "span.elision",fdjtString(" …←%d%% more→…",100-pct));
        var delision=fdjtDOM(
            "span.delision",fdjtString(" →…hide %d%%…← ",100-pct));
        elision.title="show elided text";
        delision.title="hide elided text";
        elision.onclick=handler; delision.onclick=handler;
        var elt=fdjtDOM(spec||"span.ellipsis",
                        before," ",elision,delision,elided," ",after);
        if (spec) addClass(elt,"ellipsis");
        elt.title=fdjtString.stdspace(string);
        return elt;}
    fdjtUI.Ellipsis=Ellipsis;

    function expand(node){
        if (typeof node === 'string') node=fdjtID(node);
        var ellipsis=getParent(node,".ellipsis");
        addClass(ellipsis,"expanded");
        dropClass(ellipsis,"compact");}
    Ellipsis.expand=expand;

    function contract(node){
        if (typeof node === 'string') node=fdjtID(node);
        var ellipsis=getParent(node,".ellipsis");
        addClass(ellipsis,"compact");
        dropClass(ellipsis,"expanded");}
    Ellipsis.contract=contract;
    
    function toggle(arg){
        var evt=false;
        if (!(arg)) {
            evt=window.event||false;
            if (evt) arg=fdjtUI.T(evt);
            else return;}
        else if (typeof arg === 'string') arg=fdjtID(arg);
        else if (arg.nodeType) {}
        else {
            evt=arg;
            arg=fdjtUI.T(arg);}
        var ellipsis=getParent(arg,".ellipsis");
        if (!(ellipsis)) return;
        if (evt) fdjtUI.cancel(evt);
        if (hasClass(ellipsis,"expanded")) {
            addClass(ellipsis,"compact");
            dropClass(ellipsis,"expanded");}
        else {
            addClass(ellipsis,"expanded");
            dropClass(ellipsis,"compact");}}
    Ellipsis.toggle=toggle;
    
})();

(function(){
    "use strict";
    var fdjtDOM=fdjt.DOM;
    var fdjtUI=fdjt.UI;

    function selectSubmit(evt){
        evt=evt||window.event;
        var target=fdjtUI.T(evt);
        if (target.value==="") return;
        else {
            var form=fdjtDOM.getParent(target,"FORM");
            if (form) form.submit();}}
    function setupSelectSubmit(){
        var setup=fdjtDOM.$(".fdjtselectsubmit");
        var i=0, lim=setup.length;
        while (i<lim)
            fdjtDOM.addListener(setup[i++],"change",selectSubmit);}
    fdjt.addInit(setupSelectSubmit,"selectsubmit");})();

(function(){
    "use strict";
    var fdjtDOM=fdjt.DOM;
    var fdjtUI=fdjt.UI;
    var getParent=fdjtDOM.getParent;
    var addClass=fdjtDOM.addClass;
    var dropClass=fdjtDOM.dropClass;
    
    function updatePasswordVisibility(evt,input,visible){
        evt=evt||window.event;
        if (typeof input === "string")
            input=document.getElementById(input);
        if (!(input)) return;
        var target=fdjtUI.T(evt);
        if (visible) {
            if (target.checked) input.type="PASSWORD";
            else input.type="TEXT";}
        else {
            if (target.checked) input.type="TEXT";
            else input.type="PASSWORD";}
        setTimeout(function(){input.focus();},1000);}
    fdjtUI.updatePasswordVisibility=updatePasswordVisibility;

    function uploadSelected(evt){
        evt=evt||window.event;
        var target=fdjtUI.T(evt);
        var tbody=fdjtDOM.getParent(target,".upload");
        if (tbody) fdjtDOM.addClass(tbody,"uploading");}
    fdjtUI.uploadSelected=uploadSelected;

    function focusBox_onfocus(evt){
        evt=evt||window.event;
        var target=fdjtUI.T(evt);
        var box=getParent(target,'.focusbox');
        if (box) addClass(box,"focused");}
    fdjtUI.FocusBox.focus=focusBox_onfocus;
    function focusBox_onblur(evt){
        evt=evt||window.event;
        var target=fdjtUI.T(evt);
        var box=getParent(target,'.focusbox');
        if (box)
            setTimeout(function(){dropClass(box,"focused");},
                       200);}
    fdjtUI.FocusBox.blur=focusBox_onblur;

})();

(function(){
    "use strict";
    var fdjtDOM=fdjt.DOM;
    var fdjtUI=fdjt.UI;
    var hasClass=fdjtDOM.hasClass;
    
    function fixTimeElement(elt){
        var tstring=elt.getAttribute('datetime')||
            elt.getAttribute('data-datetime')||
            elt.getAttribute('data-time');
        var parsed=((tstring)&&(new Date(tstring)));
        var good=((parsed)&&(((parsed.getYear())||"nogood")!=="nogood"));
        if (!(tstring)) {
            tstring=elt.innerText;
            parsed=new Date(tstring);
            good=((parsed)&&(((parsed.getYear())||"nogood")!=="nogood"));
            if (good) {
                if (elt.tagName==='TIME')
                    elt.setAttribute('datetime',tstring);
                else elt.setAttribute('data-datetime',tstring);}}
        if (!(good)) return;
        if (!(elt.title)) elt.title=parsed.toGMTString();
        if (hasClass(elt,"fdjtkeeptext")) {}
        else if (hasClass(elt,"fdjtisotime")) {
            if (parsed.toISOString) elt.innerHTML=parsed.toISOString();}
        else if (hasClass(elt,"fdjtutctime")) {
            if (parsed.toUTCString) elt.innerHTML=parsed.toUTCString();}
        else if (hasClass(elt,"fdjtdate")) {
            if (parsed.toDateString) elt.innerHTML=parsed.toDateString();}
        else if (hasClass(elt,"fdjtdateortime")) {
            if ((parsed.toDateString)&&(parsed.toTimeString)) {
                if ((parsed.toDateString())===((new Date()).toDateString))
                    elt.innerHTML=parsed.toTimeString();
                else elt.innerHTML=parsed.toDateString();}}
        else if (hasClass(elt,"fdjtlocaletime")) {
            if (parsed.toLocaleString) elt.innerHTML=parsed.toLocaleString();}
        else if (hasClass(elt,"fdjtlocaledate")) {
            if (parsed.toLocaleDate) elt.innerHTML=parsed.toLocaleDate();}
        else if (hasClass(elt,"fdjtlocaledateortime")) {
            if ((parsed.toLocaleDateString)&&(parsed.toTimeString)) {
                if ((parsed.toDateString())===((new Date()).toDateString))
                    elt.innerHTML=parsed.toLocaleTimeString();
                else elt.innerHTML=parsed.toLocaleDateString();}
            if (parsed.toLocaleDate) elt.innerHTML=parsed.toLocaleDate();}
        else if (hasClass(elt,"fdjthumantime")) {
            if ((parsed.toDateString)&&(parsed.toLocaleTimeString)) 
                elt.innerHTML=parsed.toDateString()+" ("+parsed.toLocaleTimeString()+")";
            else if (parsed.toLocaleString)
                elt.innerHTML=parsed.toLocaleString();
            else elt.innerHTML=parsed.toString();}
        else {
            if ((parsed.toDateString)&&(parsed.toLocaleTimeString)) 
                elt.innerHTML=parsed.toDateString()+" ("+parsed.toLocaleTimeString()+")";
            else if (parsed.toLocaleString)
                elt.innerHTML=parsed.toLocaleString();
            else elt.innerHTML=parsed.toString();}}

    function initTimeElements(node){
        var elts=((node)?
                  ((fdjt.keeptime)?
                   (fdjtDOM.getChildren(node,".fdjtime")):
                   (fdjtDOM.getChildren(node,"time,.fdjtime"))):
                  ((fdjt.keeptime)?
                   (fdjtDOM.$(".fdjtime")):
                   (fdjtDOM.$("time,.fdjtime"))));
        var i=0, lim=elts.length;
        while (i<lim) fixTimeElement(elts[i++]);}
    fdjt.initTimeElements=initTimeElements;

    fdjt.autoInitTimeElements=function(){
        fdjtDOM.addListener(document.body,"DOMNodeInserted",
                            function(evt){
                                evt=evt||window.event;
                                initTimeElements(fdjtUI.T(evt));});};
    fdjt.addInit(initTimeElements,"TimeElements",false);})();

(function(){
    "use strict";
    var vibrate=navigator.vibrate||navigator.webkitVibrate||
        navigator.mozVibrate||navigator.msVibrate;
    fdjt.UI.vibrate=function(args){
        if (!(vibrate)) return false;
        vibrate(args);
        return true;};})();

fdjt.disenableInputs=fdjt.UI.disenableInputs=
    (function(){
        "use strict";
        var fdjtDOM=fdjt.DOM;
        var getStyle=fdjtDOM.getStyle;
        var hasClass=fdjtDOM.hasClass;
        var $=fdjtDOM.$;
        
        function disenableInputs(under){
            var inputs=$("input,select,button,textarea",under);
            var i=0, lim=inputs.length;
            while (i<lim) {
                var input=inputs[i++];
                if (hasClass(input,"fdjtignore")) continue;
                var scan=input, disable=false;
                while ((scan)&&(scan!==under)) {
                    var style=getStyle(scan);
                    if (style.display==='none') {
                        disable=true; break;}
                    scan=scan.parentNode;}
                input.disabled=disable;}}
        return disenableInputs;})();

/* Emacs local variables
   ;;;  Local variables: ***
   ;;;  compile-command: "make; if test -f ../makefile; then cd ..; make; fi" ***
   ;;;  indent-tabs-mode: nil ***
   ;;;  End: ***
*/
