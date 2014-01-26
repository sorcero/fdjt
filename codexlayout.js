/* -*- Mode: Javascript; Character-encoding: utf-8; -*- */

/* ######################### fdjt/codex.js ###################### */

/* Copyright (C) 2009-2013 beingmeta, inc.
   This file is a part of the FDJT web toolkit (www.fdjt.org)
   It implements a method for breaking narrative HTML content
   across multiple pages, attempting to honor page break constraints,
   etc.

   Check out the 'mini manual' at the bottom of the file or read the
   code itself.

   This program comes with absolutely NO WARRANTY, including implied
   warranties of merchantability or fitness for any particular
   purpose.

   Use, modification, and redistribution of this program is permitted
   under either the GNU General Public License (GPL) Version 2 (or any
   later version) or under the GNU Lesser General Public License
   (version 3 or later).

   These licenses may be found at www.gnu.org, particularly:
   http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
   http://www.gnu.org/licenses/lgpl-3.0-standalone.html

   Use and redistribution (especially embedding in other CC licensed
   content) is also permitted under the terms of the Creative Commons
   "Attribution-NonCommercial" license:

   http://creativecommons.org/licenses/by-nc/3.0/ 

   Other uses may be allowed based on prior agreement with
   beingmeta, inc.  Inquiries can be addressed to:

   licensing@beingmeta.com

   Enjoy!

*/
/* jshint browser: true */

// var fdjt=((window)?((window.fdjt)||(window.fdjt={})):({}));

fdjt.CodexLayout=
    (function(){
        "use strict";
        var fdjtDOM=fdjt.DOM;
        var fdjtLog=fdjt.Log;
        var fdjtTime=fdjt.Time;
        var fdjtState=fdjt.State;
        var fdjtID=fdjt.ID;

        var hasContent=fdjtDOM.hasContent;
        var hasParent=fdjtDOM.hasParent;
        var getParent=fdjtDOM.getParent;
        var getStyle=fdjtDOM.getStyle;
        var parsePX=fdjtDOM.parsePX;
        var hasClass=fdjtDOM.hasClass;
        var addClass=fdjtDOM.addClass;
        var dropClass=fdjtDOM.dropClass;
        var toArray=fdjtDOM.toArray;
        var getElementValue=fdjtDOM.getElementValue;
        
        var floor=Math.floor;

        var layoutDB;

        function appendChildren(node,children,start,end){
            var lim=end||children.length; var i=(start)||0;
            var frag=document.createDocumentFragment();
            while (i<lim) {
                if (children[i])
                    frag.appendChild(children[i++]);
                else i++;}
            node.appendChild(frag);}

        function getGeom(elt,root,extra){
            var top = elt.offsetTop;
            var left = elt.offsetLeft;
            var width=elt.offsetWidth;
            var height=elt.offsetHeight;
            var rootp=((root)&&(root.offsetParent));
            var style=((extra)&&(getStyle(elt)));

            if (elt===root) 
                return {left: 0,top: 0,width:width,height: height};
            elt=elt.offsetParent;
            while (elt) {
                if ((root)&&((elt===root)||(elt===rootp))) break;
                top += elt.offsetTop;
                left += elt.offsetLeft;
                elt=elt.offsetParent;}
            
            if (extra) {
                var t_margin=parsePX(style.marginTop);
                var r_margin=parsePX(style.marginRight);
                var b_margin=parsePX(style.marginBottom);
                var l_margin=parsePX(style.marginLeft);
                var t_padding=parsePX(style.paddingTop);
                var r_padding=parsePX(style.paddingRight);
                var b_padding=parsePX(style.paddingBottom);
                var l_padding=parsePX(style.paddingLeft);
                var t_border=parsePX(style.borderTopWidth);
                var r_border=parsePX(style.borderRightWidth);
                var b_border=parsePX(style.borderBottomWidth);
                var l_border=parsePX(style.borderLeftWidth);
                var outer_width=width+l_margin+r_margin;
                var outer_height=height+t_margin+b_margin;
                var inner_width=width-(l_border+l_padding+r_border+r_padding);
                var inner_height=height-(t_border+t_padding+b_border+b_padding);
                var lh=style.lineHeight, fs=style.fontSize, lhpx=false;
                if (lh==="normal") lhpx=parsePX(fs);
                else if (lh.search(/px$/)>0) lhpx=parsePX(lh);
                else if (lh.search(/%$/)>0) 
                    lhpx=(parseFloat(lh.slice(0,-1))/100)*(parsePX(fs));
                else lhpx=parsePX(fs);
                return {left: left, top: top, width: width,height: height,
                        right:left+width,bottom:top+height,
                        top_margin: t_margin, bottom_margin: b_margin,
                        left_margin: l_margin, right_margin: r_margin,
                        outer_height: outer_height,outer_width: outer_width,
                        inner_height: inner_height,inner_width: inner_width,
                        line_height: lhpx};}
            else return {left: left, top: top, width: width,height: height,
                         right:left+width,bottom:top+height};}

        var getChildren=fdjtDOM.getChildren;

        /* Node testing */

        var notspace=/[^\n\r\t\f\x0b\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u200b\u2028\u2029\u202f\u205f\u3000\uf3ff]/g;
     
        function isEmpty(string){
            if (typeof string === "string")  {
                var pt;
                if (string.length===0) return true;
                else pt=string.search(notspace);
                if (pt<0) return true;
                else if (string[pt]!=='&') return false;
                else {
                    string=string.replace(/&nbsp;/g,"\u00a0");
                    pt=string.search(notspace);
                    return (pt<0);}}
            else return false;}
        
        function optimizeLayoutRule(rule){
            if (!(rule)) return rule;
            else if (typeof rule === "string") {
                if ((rule[0]===".")&&
                    (rule.slice(1).search(/\.|#|\[/)<0)) 
                    return new RegExp("\\b"+rule.slice(1)+"\\b");
                else return new fdjtDOM.Selector(rule);}
            else if (rule instanceof RegExp) return rule;
            else if (rule.match) return rule;
            else if (rule.length) {
                var newrules=[]; var firstrules=[];
                var classes=[]; var selectors=[];
                var i=0, lim=rule.length;
                while (i<lim) {
                    var r=rule[i++];
                    if (typeof r !== "string") newrules.push(r);
                    else if (r[0]===".") {
                        if (r.slice(1).search(/\.|#|\[/)>=0)
                            // complex selector (not just a classname)
                            selectors.push(r);
                        else classes.push(r.slice(1));}
                    else if ((r[0]==="#")||(r[0]==="["))
                        selectors.push(r);
                    else classes.push(r);}
                if (classes.length)
                    firstrules.push(new RegExp("\\b("+classes.join("|")+")\\b"));
                if (selectors.length)
                    firstrules.push(new fdjtDOM.Selector(selectors.join(", ")));
                return firstrules.concat(newrules);}
            else return rule;}

        function testNode(node,test) {
            var tests;
            if (!(test)) return true;
            if (typeof test === 'string') tests=[test];
            else if (test instanceof Array) tests=test;
            else tests=[test];
            var i=0; var lim=tests.length;
            while (i<lim) {
                var atest=tests[i++];
                if (node===test) return true;
                else if (atest instanceof RegExp) {
                    if (!(node.className)) continue;
                    if (!(node.className.search)) continue;
                    // Handle inadvertant use of selector syntax
                    if (node.className.search(atest)>=0) return true;}
                else if (typeof atest === 'string') {
                    if (!(node.className)) continue;
                    if (!(node.className.search)) continue;
                    // Handle inadvertant use of selector syntax
                    if (atest[0]==='.') atest=atest.slice(1);
                    var classrx=new RegExp("\\b"+atest+"\\b");
                    if (node.className.search(classrx)>=0) return true;}
                else if ((atest.match)&&(atest.match(node)))
                    // This should get most versions of CSS selectors
                    return true;
                else {}}
            return false;}

        /* Tweaking fonts */

        function scaleToPage(elt,width,height,leavefont){
            if (typeof elt === "string") elt=fdjtID(elt);
            if ((!(elt))||(elt.length===0)) return;
            else if (elt.nodeType) {
                if (elt.nodeType!==1) return;
                if ((hasClass(elt,"codexpagescaled"))||(elt.getAttribute("style")))
                    return;
                var ps=elt.getAttribute("data-pagescale")||
                    elt.getAttribute("pagescale")||
                    getElementValue(elt,"xdatapagescale");
                var psw=1, psh=1;
                var style=elt.style;
                var cstyle=getStyle(elt);
                // If it has an individual transform, don't mess it up
                if ((style[fdjtDOM.transform])&&
                    (style[fdjtDOM.transform]!=="none")&&
                    (style[fdjtDOM.transform]!==""))
                    return;
                if (ps) {
                    var psv=ps.split(/ |,|x/g);
                    if (psv.length===2) {
                        psw=parseScale(psv[0]);
                        psh=parseScale(psv[1]);}
                    else psh=psw=parseScale(psv[0]);}
                // Target width and height
                var tw=width*psw, th=height*psh;
                var w=elt.offsetWidth, h=elt.offsetHeight;
                // Scale factors for width and height
                var sw=tw/w, sh=th/h;
                if (elt.tagName==="IMG") {
                    style.maxHeight=style.minHeight="inherit";
                    style.maxWidth=style.minWidth="inherit";
                    // Get width and height again, with the constraints off
                    //  This means that pagescaling trumps CSS constraints,
                    //  but we'll accept that for now
                    w=elt.offsetWidth; h=elt.offsetHeight; sw=tw/w; sh=th/h;
                    if (sw<sh) {
                        style.width=Math.round(w*sw)+"px";
                        style.height="auto";}
                    else {
                        style.height=Math.round(h*sh)+"px";
                        style.width="auto";}}
                else {
                    if (!(leavefont)) tweakFont(elt,tw,th);
                    if (cstyle.display==="inline")
                        style.display="inline-block";
                    style.width=tw+"px"; style.height=th+"px";}
                addClass(elt,"codexpagescaled");}
            else if (elt.length) {
                var i=0, lim=elt.length;
                while (i<lim) scaleToPage(elt[i++],width,height,leavefont||false);}
            else {}}

        function tweakFont(node,width,height,min_font,max_font){
            var i, lim, nodes=[];
            if (!(width)) width=node.offsetWidth;
            if (!(height)) height=node.offsetHeight;
            if (!(min_font))
                min_font=node.getAttribute("data-minfont")||node.getAttribute("minfont");
            if (!(max_font))
                max_font=node.getAttribute("data-maxfont")||node.getAttribute("maxfont");
            if ((max_font)&&(typeof max_font==="string"))
                max_font=parseFloat(max_font); 
            if ((min_font)&&(typeof min_font==="string"))
                min_font=parseFloat(min_font); 
            var wrapper=fdjtDOM("div"); {
                // Set up the inline-block wrapper we'll use for sizing
                wrapper.style.display="inline-block";
                wrapper.style.maxWidth=width+"px";
                var children=node.childNodes;
                i=0; lim=children.length;
                while (i<lim) nodes.push(children[i++]);
                i=0; lim=nodes.length;
                while (i<lim) wrapper.appendChild(nodes[i++]);
                node.appendChild(wrapper);}
            // Now we actually tweak font sizes
            var font_pct=100, count=0, delta=16, best_fit=false;
            node.style.fontSize=font_pct+"%";
            var ih=wrapper.offsetHeight, iw=wrapper.offsetWidth;
            var hr=ih/height, wr=iw/width; 
            while (((hr>1)||(wr>1)||((hr<(0.9*height))&&(wr<(0.9*width))))&&
                   (count<20)&&((delta>=1)||(delta<=-1))) {
                if ((hr<=1)&&(wr<=1)) {
                    if (!(best_fit)) best_fit=font_pct;
                    else if (font_pct>best_fit) best_fit=font_pct;}
                if (((hr>1)||(wr>1))&&(delta>0)) {
                    delta=delta/-2; font_pct=font_pct+delta;}
                else if (((hr<=1)&&(wr<=1))&&(delta<0)) {
                    delta=delta/-2; font_pct=font_pct+delta;}
                else font_pct=font_pct+delta;
                if ((max_font)&&(font_pct>max_font)) break;
                if ((min_font)&&(font_pct<min_font)) break;                
                node.style.fontSize=font_pct+"%";
                ih=wrapper.offsetHeight; iw=wrapper.offsetWidth;
                hr=ih/height; wr=iw/width; 
                count++;}
            if ((hr>1)||(wr>1)&&(best_fit)) node.style.fontSize=best_fit+"%";
            node.removeChild(wrapper);
            i=0; lim=nodes.length;
            while (i<lim) node.appendChild(nodes[i++]);
            return node;}

        function parseScale(s){
            if (s.search(/%$/g)>0) {
                var pct=parseFloat(s.slice(0,s.length-1));
                return pct/100;}
            else return parseFloat(s);}

        function atPageTop(node,body){
            if (!(body)) body=document.body;
            var scan=node; while (scan) {
                if (scan===body) return false;
                else if (!(scan.previousSibling)) scan=scan.parentNode;
                else if ((scan.previousSibling.nodeType===3)&&
                         (isEmpty(scan.previousSibling.nodeValue)))
                    scan=scan.previousSibling;
                else break;}
            return ((scan.nodeType===1)&&
                    (scan.className)&&(scan.className.search)&&
                    (scan.className.search(/\bcodexpage\b/g)>=0));}

        /* Duplicating nodes */

        var tmpid_count=1;

        // This recreates a node and it's DOM context (containers) on
        //  a new page, calling itself recursively as needed
        function dupContext(node,page,dups,crumbs){
            if ((node===document.body)||(node.id==="CODEXCONTENT")||
                (hasClass(node,"codexroot"))||(hasClass(node,"codexpage")))
                return false;
            else if (hasParent(node,page)) return node;
            else if ((node.className)&&(node.className.search)&&
                     (node.className.search(/\bcodexwraptext\b/)>=0))
                // We don't bother duplicating text wrapping convenience
                //  classes
                return dupContext(node.parentNode,page,dups,crumbs);
            // Now we actually duplicate it.  
            var id=node.id, baseid=node.getAttribute("data-baseid");
            if (!(id)) id=baseid;
            // If it doesn't have an ID, we give it one, because we'll want
            //  to refer to it later while wanting to avoid DOM cycles
            if (!(id)) id=node.id="CODEXTMPID"+(tmpid_count++);
            else if (dups[id]) {
                // See if it's already been duplicated
                var scan_dups=dups[id]; var d=scan_dups.length-1;
                while (d>=0) {
                    if (hasParent(scan_dups[d],page)) return scan_dups[d];
                    else d--;}}
            // Duplicate it's parent
            var copy=node.cloneNode(false);
            var parent=dupContext(node.parentNode,page,dups,crumbs);
            var nodeclass=((node.className)&&(node.className.search)&&
                           (node.className))||"";
            var duplicated=(nodeclass.search(/\bcodexdup.*\b/)>=0);
            if (baseid) copy.codexbaseid=baseid;
            // Jigger the class name
            copy.className=
                ((nodeclass.replace(/\b((codexrelocated)|(codexdup.*))\b/g,""))+
                 " codexdup").replace(/\s+/," ").trim();
            if (!(duplicated)) {
                // If there's not a already a duplicate, declare the
                // root node to the start
                if (nodeclass.search(/\bcodexdupstart\b/)<0) {
                    node.className=nodeclass+" codexdupstart";
                    stripBottomStyles(node,true);}}
            
            // Strip top style information from copy
            if (copy.getAttribute("style")) stripTopStyles(copy);
            // If the original had an ID, save it in various ways
            if (id) {
                copy.codexbaseid=id;
                copy.setAttribute("data-baseid",id);
                copy.removeAttribute("id");}
            // Record the copy you've made (to avoid recreation)
            if (dups[id]) dups[id].push(copy);
            else dups[id]=[copy];
            // If it's got a copied context, append it to the context;
            //   otherwise, just append it to the page
            if (parent) parent.appendChild(copy);
            else page.appendChild(copy);
            return copy;}

        function stripBottomStyles(node,keep){
            var style=node.style, string=style.cssText;
            if (keep) node.setAttribute("data-savedstyle",string);
            style.paddingBottom="0px";
            style.borderBottomWidth="0px";
            style.marginBottom="0px";
            style.pageBreakAfter="auto";}
        function stripTopStyles(node,keep){
            var style=node.style, string=style.cssText;
            if (keep) node.setAttribute("data-savedstyle",string);
            style.textIndent="0px";
            style.paddingTop="0px";
            style.borderTopWidth="0px";
            style.marginTop="0px";
            style.pageBreakBefore="auto";}

        /* Moving nodes */

        function getFirstContent(node){
            var child=node.firstChild;
            while (child) {
                if (child.nodeType===3) {
                    if (!(isEmpty(child.nodeValue))) return child;}
                else if (child.nodeType!==1) {}
                else return child;
                child=child.nextSibling;}
            return false;}
        
        // This moves a node into another container, leaving
        // a back pointer for restoration
        function moveNode(arg,into,blockp,crumbs){
            var baseclass; var node=arg;
            if (hasParent(node,into)) return node;
            if (node.nodeType===1) {
                baseclass=node.className;
                if ((baseclass)&&(typeof baseclass !== "string")) {
                    into.appendChild(node);
                    return node;}}
            else if (node.nodeType===3) {
                if (node.nodeValue.search(/\w/g)>=0) {
                    // Wrap non-empty text nodes in elements before
                    // moving
                    var wrapnode=fdjtDOM(
                        ((blockp)?"div.codexwraptext":"span.codexwraptext"));
                    if (node.parentNode)
                        node.parentNode.replaceChild(wrapnode,node);
                    wrapnode.appendChild(node);
                    baseclass="codexwraptext";
                    node=wrapnode;}
                else if (into) {
                    node=node.cloneNode(true);
                    into.appendChild(node);
                    return node;}}
            if ((node.parentNode)&&((!(node.id))||(!(crumbs[node.id])))) {
                // If the node has a parent and hasn't been moved before,
                //  we leave a "crumb" (a placeholder) in the original
                //  location.
                if (!(node.id)) node.id="CODEXTMPID"+(tmpid_count++);
                // Record origin information; we'll use this to revert
                //  the layout if we need to (for example, before
                //  laying out again under different constraints)
                var crumb=document.createTextNode("");
                crumbs[node.id]=crumb;
                if (baseclass) node.className=baseclass+" codexrelocated";
                else node.className="codexrelocated";
                node.parentNode.replaceChild(crumb,node);}
            if (into) into.appendChild(node);
            return node;}
        
        function markPageTop(node){
            if (hasClass(node,"codexpagetop")) return;
            var nodestyle=node.getAttribute("style")||"";
            var newstyle=nodestyle+((nodestyle)?("; "):(""))+"margin-top: 0px !important";
            node.setAttribute("data-oldstyle",nodestyle);
            node.setAttribute("style",newstyle);
            addClass(node,"codexpagetop");
            if (node.childNodes) {
                var children=node.childNodes, i=0, lim=children.length;
                while (i<lim) {
                    var child=children[i++];
                    if (child.nodeType===1) {
                        var style=getStyle(child);
                        if (style.position!=='static') {}
                        else if ((child.classname)&&
                                 (child.className.search(/\bfdjtskiptext\b/g)>=0)) {}
                        else return markPageTop(child);}
                    else if (child.nodeType===3) {
                        if (!(isEmpty(child.nodeValue))) return;}
                    else {}}}}

        // This moves a node onto a page, recreating (as far as
        // possible) its original DOM context on the new page.
        function moveNodeToPage(node,page,dups,crumbs){
            if (hasParent(node,page)) {
                if ((node.nodeType===1)&&(!(hasContent(page,true,false,node))))
                    markPageTop(node);
                return node;}
            else {
                var move=node, parent=move.parentNode;
                // If we're moving a first child, we might as well move the parent
                while ((parent)&&
                       (parent!==document.body)&&
                       (parent.id!=="CODEXCONTENT")&&
                       (!(hasClass(parent,"codexroot")))&&
                       (!(hasClass(parent,"codexpage")))&&
                       (move===getFirstContent(parent))) {
                    move=parent; parent=move.parentNode;}
                if ((!(parent))||(parent===document.body)||
                    (parent.id==="CODEXCONTENT")||
                    (hasClass(parent,"codexroot"))||
                    (hasClass(parent,"codexpage"))) {
                    // If the node isn't on a page or is at top level of a
                    // page, the parent doesn't need to be duplicated to
                    // move the child.  However, the motion might modify
                    // the moved node (for example, cloning it).
                    if (move===node)
                        node=move=moveNode(node,page,false,crumbs);
                    else move=moveNode(move,page,false,crumbs);}
                else {
                    // Otherwise duplicate the parent and move the child
                    var dup_parent=dupContext(parent,page,dups,crumbs);
                    if (move===node)                    
                        node=move=moveNode(node,dup_parent||page,false,crumbs);
                    else move=moveNode(move,dup_parent||page,false,crumbs);}
                if ((move)&&(move.nodeType===1)&&(!hasContent(page,true,false,move)))
                    markPageTop(move);
                return node;}}

        // Reverting layout

        function restoreNode(node,info,crumbs,texts){
            var id=node.id;
            if (!(id)) return;
            var origin=crumbs[id];
            if (origin) {
                var parent=origin.parentNode;
                if (hasClass(node,/\bcodexwraptext\b/g)) {
                    if (hasClass(node,/\bcodexwraptextsplit\b/g))
                        parent.replaceChild(texts[id],origin);
                    else parent.replaceChild(node.childNodes[0],origin);}
                else origin.parentNode.replaceChild(node,origin);}
            dropClass(node,"codexrelocated");}
        
        function revertLayout(layout) {
            var crumbs=layout.crumbs; var now=fdjtTime(), i=0, lim;
            if ((layout.reverting)&&((now-layout.reverting)<10000)) return;
            else layout.reverting=now;
            var dupstarts=layout.container.getElementsByClassName(
                "codexdupstart");
            i=0; lim=dupstarts; while (i<lim) {
                var dup=dupstarts[i++];
                var saved_style=dup.getAttribute("data-savedstyle");
                if (saved_style) dup.setAttribute("style",saved_style);}
            var textsplits=layout.textsplits;
            var node;
            var pagescaled=toArray(
                layout.container.getElementsByClassName("codexpagescaled"));
            i=0; lim=pagescaled.length; while (i<lim) {
                var elt=pagescaled[i++];
                dropClass(elt,"codexpagescaled");
                elt.setAttribute("style","");}
            var cantsplit=toArray(
                layout.container.getElementsByClassName("codexcantsplit"));
            dropClass(cantsplit,"codexcantsplit");
            var split=toArray(
                layout.container.getElementsByClassName("codexsplitstart"));
            i=0; lim=split.length; while (i<lim) {
                node=split[i++];
                var nodeid=node.id;
                var text=textsplits[nodeid];
                node.parentNode.replaceChild(text,node);}
            var shards=toArray(
                layout.container.getElementsByClassName("codextextsplit"));
            i=0; lim=shards.length; while (i<lim) {
                node=shards[i++];
                node.parentNode.removeChild(node);}
            var leading=toArray(
                layout.container.getElementsByClassName("codexdupleading"));
            if ((leading)&&(leading.length)) fdjtDOM.remove(leading);
            var moved=toArray(
                layout.container.getElementsByClassName("codexrelocated"));
            if ((moved)&&(moved.length)) {
                layout.logfn(
                    "Reverting layout of %d nodes and %d split texts",
                    moved.length,textsplits.length);
                i=0; lim=moved.length;
                while (i<lim)
                    restoreNode(moved[i++],layout,crumbs,textsplits);}
            layout.textsplits={}; layout.crumbs={};}
        
        function addDupLeading(block){
            block.appendChild(fdjtDOM("span.codexdupleading","leading"));}

        /* Codex trace levels */
        /* 0=notrace
           1=trace tracked nodes
           2=trace addition of top level chunks
           3=trace insertion of page breaks
           4=trace every node consideration
        */

        function CodexLayout(init){
            if (!(init)) init={};

            var layout=this;

            this.init=init;

            // Layout rules
            var forcebreakbefore=this.forcebreakbefore=
                optimizeLayoutRule(init.forcebreakbefore||false);
            var forcebreakafter=this.forcebreakafter=
                optimizeLayoutRule(init.forcebreakafter||false);
            var avoidbreakinside=this.avoidbreakinside=
                optimizeLayoutRule(init.avoidbreakinside||false);
            var avoidbreakafter=this.avoidbreakafter=
                optimizeLayoutRule(init.avoidbreakafter||false);
            var avoidbreakbefore=this.avoidbreakbefore=
                optimizeLayoutRule(init.avoidbreakbefore||false);
            var fullpages=this.fullpages=
                optimizeLayoutRule(init.fullpages||false);
            var singlepages=this.singlepages=
                optimizeLayoutRule(init.singlepages||false);
            var floatpages=this.floatpages=
                optimizeLayoutRule(init.floatpages||false);
            var floatblocks=this.floatblocks=
                optimizeLayoutRule(init.floatblocks||false);

            var pageprefix=this.pageprefix=init.pageprefix||"CODEXPAGE";

            // Layout Dimensions
            var page_height=this.height=init.page_height||fdjtDOM.viewHeight();
            var page_width=this.width=init.page_width||fdjtDOM.viewWidth();
            // Set the orientation when provided
            var orientation=(init.orientation)||
                ((page_width>page_height)?('landscape'):('portrait'));
            this.orientation=orientation;
            
            var pagefn=(init.pagefn)||false;

            // What constitutes a short page
            var short_page_height=
                ((init.hasOwnProperty("short_page_height"))&&
                 ((init.short_page_height)&&
                  ((init.short_page_height<=1)?(page_height*init.short_page_height):
                   (init.short_page_height))));

            // Break 'paragraphs' (anything with just text and inline nodes)
            var break_blocks=this.break_blocks=
                ((typeof init.break_blocks === 'undefined')?(true):
                 (init.break_blocks));

            // Atomic nodes can't be broken.  Specifying this can
            // speed up page layout in some cases.
            var atomic=init.atomic||false;
            if (typeof atomic === "string") atomic=fdjtDOM.selector(atomic);
            else if ((atomic.length)&&(atomic.join))
                // Arrays of selector strings
                atomic=fdjtDOM.selector(atomic.join(","));
            else {}
            this.atomic=atomic;

            this.dontsave=init.dontsave||false;

            var use_scaling=
                ((typeof init.use_scaling === 'undefined')?(true):
                 (init.use_scaling));

            // Scale pages (use CSS to shrink pages to fit)
            var scale_pages=this.scale_pages=
                ((use_scaling)&&
                 ((typeof init.scale_pages === 'undefined')?(true):
                  (init.scale_pages)));
            
            // This is the node DOM container where we place new pages
            var container=this.container=
                init.container||fdjtDOM("div.codexpages");
            
            var origin=this.origin=init.origin||false;

            function noop(){}
            var logfn=this.logfn=
                init.logfn||CodexLayout.logfn||
                ((typeof fdjtLog !== 'undefined')?(fdjtLog):(noop));

            // STATE variables

            var pagenum=this.pagenum=0; // Tracks current page number
            var pages=this.pages=[]; // Array of all pages generated, in order
            var dups=this.dups={}; // Tracks nodes/contexts already duplicated
            // Maps IDs to text nodes left behind as placeholders when
            //  the original nodes were moved.
            var crumbs=this.crumbs={}; 
            var cur_root=this.root=false; // The root currently being added

            // Tracks text nodes which have been split, keyed by the
            // temporary IDs assigned to them
            var textsplits=this.textsplits={};

            var page=this.page=init.page; // Contains the currently open page

            var prev=this.prev=false; // The last terminal block we processed
            var prevstyle=this.prevstyle=false;

            // this.drag[] contains nodes which will go on the next
            // page when we get there.  The nodes in this.drag[] have
            // already been placed on pages, but we keep track of them
            // in case we need to move them to a new page to honor
            // nobreak constraints.
            var drag=this.drag=[];

            // this.floating contains fully-assembled page nodes to
            // placed in pages after this one; it is intended for
            // out-of-flow or 'too bit to fit' content
            var floating=this.floating=[];

            if (init.layout_id) this.layout_id=init.layout_id;

            // Startup

            this.started=false; // When we started
            var trace=this.tracelevel=  // How much to trace
            init.tracelevel||CodexLayout.tracelevel||
                (fdjtState.getLocal("codexlayout.trace",true))||0;
            var track=init.track||CodexLayout.track||
                (fdjtState.getLocal("codexlayout.track"))||false;
            if (track) {
                this.track=track=fdjtDOM.Selector(track);
                if (!(trace)) trace=this.tracelevel=1;}
            else this.track=false;
            this.roots=init.roots||[]; // Where all roots can be tracked
            this.root_count=0; // Number of root nodes added
            this.block_count=0;
            this.lastid=false;
            this.timeslice=
                ((init.hasOwnProperty('timeslice'))?(init.timeslice):
                 (CodexLayout.timeslice));
            this.timeskip=
                ((init.hasOwnProperty('timeskip'))?(init.timeskip):
                 (CodexLayout.timeskip));
            
            var pagerule=this.pagerule=init.pagerule||false;
            
            function moveNode(node){
                if (trace) {
                    if ((trace>3)||((track)&&(track.match(node))))
                        logfn("Moving node %o to page %o",node,page);}
                // if (lastmove!==node) {allmoves.push(node); lastmove=node;}
                return moveNodeToPage(node,page,dups,crumbs);}

            //  addContent calls loop() exactly once to set up the
            //   actual loop to be timesliced with repeated calls
            //   setTimeout and a final call to doneFn.  The real
            //   inner function is step(), which relies on state
            //   stored in its closure.
            function addContent(root,timeslice,timeskip,
                                trace,progressfn,donefn) {
                
                var newpage=false, newpages=((page)?([page]):([]));
                var start=fdjtTime();
                if (!(page)) {newPage(); newpage=true;}

                if ((timeslice)&&(typeof timeslice !== "number")) 
                    timeslice=layout.timeslice;
                if ((timeskip)&&(typeof timeskip !== "number"))
                    timeskip=layout.timeskip;

                if (typeof trace === 'undefined') trace=layout.tracelevel;
                if (typeof progressfn === 'undefined')
                    progressfn=layout.progressfn||false;
                if (!(layout.started)) layout.started=start;
                // If it's already been added to a page, don't do it again.
                if (getParent(root,".codexpage")) {
                    pagesDone(newpages); newpages=[];
                    if (donefn) donefn(layout);
                    return false;}
                layout.roots.push(root);
                layout.root_count++;

                var fullpage=hasClass(root,"codexfullpage")||
                    ((fullpages)&&(testNode(root,fullpages)));
                var singlepage=
                    (fullpage)||
                    (hasClass(root,"codexsinglepage"))||
                    (checkSinglePage(root));
                if (newpage) root=moveNode(root);
                else if (singlepage) newPage(root);
                else if ((forcedBreakBefore(root))||
                         ((prev)&&(forcedBreakAfter(prev)))) {
                    root=newPage(root);}
                else root=moveNode(root);
                var scale_elts=getChildren(root,"[data-pagescale],[pagescale]");
                scaleToPage(scale_elts,page_width,page_height);
                var geom=getGeom(root,page);
                if (singlepage) {
                    var pw=geom.width, ph=geom.height;
                    if ((pw>page_width)||(ph>page_height))
                        addClass(page,"codexoversize");
                    else if ((fullpage)&&
                             ((pw<(0.9*page_width))&&(ph<(0.9*page_height))))
                        addClass(page,"codexundersize");
                    else {}
                    // Start a new page and update the loop state
                    newPage(); prev=layout.prev=root;
                    prevstyle=layout.prevstyle=getStyle(root);
                    pagesDone(newpages); newpages=[];
                    if (donefn) donefn(layout);
                    return;}
                else {
                    if (geom.bottom<=page_height) {
                        prev=layout.prev=root;
                        prevstyle=layout.prevstyle=getStyle(root);
                        pagesDone(newpages); newpages=[];
                        if (donefn) donefn(layout);
                        return;}
                    else if (((atomic)&&(atomic.match(root)))||
                             (avoidBreakInside(root))) {
                        if (!(newpage)) newPage(root);
                        prev=layout.prev=root;
                        prevstyle=layout.prevstyle=getStyle(root);
                        pagesDone(newpages); newpages=[];
                        if (donefn) donefn(layout);
                        return;}}

                var blocks=[], terminals=[], styles=[];
                // gather all of the block-level elements
                // (recursively) in the node, noting which ones are
                // terminals.  This should be pretty fast, so we do it
                // synchronously
                gatherBlocks(root,blocks,terminals,styles);
                layout.block_count=layout.block_count+blocks.length;
                if (trace>1)
                    logfn("Laying out %d blocks from %o; page=%o",
                          blocks.length,root,page);

                // If there aren't any blocks, we try adding the
                //  content to the current page and, if it goes over,
                //  create a new page for it and call the donefn.  At
                //  the top level, we only split blocks.
                if (blocks.length===0) {
                    if (!(newpage)) newPage(root);
                    layout.root=cur_root=false;
                    pagesDone(newpages); newpages=[];
                    if (donefn) donefn(layout);
                    return;}
                
                layout.root=cur_root=root;

                var ni=0, nblocks=blocks.length; 
                
                function step(){
                    var block=blocks[ni]; var style=styles[ni];
                    var terminal=terminals[ni]||false;
                    var tracing=false;
                    if (block.id) layout.lastid=block.id;

                    if ((trace)&&(block)&&
                        ((trace>3)||((track)&&(track.match(block))))) {
                        logfn("Considering block %o (#%d from %o); page=%o",
                              block,ni,root,page);
                        tracing=true;}
                    
                    // FIRST, HANDLE DRAGGING
                    handle_dragging(block,terminal,style);
                    
                    if (block) block=handle_standalone(block,style);
                    // If a block is false, continue
                    if (!(block)) {ni++; return;}
                    
                    // Finally, we check if everything fits.  We're
                    // walking through the blocks[] but only advance
                    // when an element fits or can't be split or
                    // tweaked Note that we may process an element [i]
                    // more than once if we split the node and part of
                    // the split landed back in [i].
                    var geom=getGeom(block,page);
                    if ((trace)&&((trace>3)||((track)&&(track.match(block)))))
                        logfn("Layout/geom %o %j",block,geom);
                    if (geom.bottom>page_height) {
                        if (!(terminal)) {
                            if (tracing)
                                logfn("Oversize non-terminal %o, continuing",
                                      block);
                            ni++;}
                        // If we get here, we're a terminal node
                        // which extends below the bottom of the page
                        else if (((short_page_height)?
                                  (geom.top>short_page_height):
                                  (geom.top>page_height))&&
                                 (drag.length===0)&&
                                 (!(avoidBreakBefore(block,style))))
                            // Our top is also over the bottom of the page,
                            // and we can break here, so we just push off 
                           block=newPage(block);
                        else if ((hasClass(block,"codexfloat"))||
                                 ((floatblocks)&&(floatblocks.match(block)))) {
                            // If the block can float, let it
                            floating.push(block); ni++;}
                        else if (((!(break_blocks))||
                                  ((atomic)&&(atomic.match(block)))||
                                  (avoidBreakInside(block,style))||
                                  (hasClass(block,"codexcantsplit")))) {
                            var broken=handle_unbreakable(block,style,geom,tracing);
                            if (!(broken)) ni++;
                            else block=broken;}
                        else {
                            // Now we try to split the block, we store
                            // the 'split block' back in the blocks
                            // variable because we might need to split
                            // it again.
                            if (tracing) logfn("Splitting block %o @ %o",block,page);
                            var split=splitBlock(block,style);
                            if ((split)&&(split!==block)) blocks[ni]=split;
                            else {
                                geom=getGeom(block,page);
                                if (geom.bottom>page_height) {
                                    addClass(page,"codexoversize");
                                    layout.drag=drag=[];
                                    newPage();}
                                ni++;}}}
                    // We fit on the page, so we'll look at the next block.
                    else {
                        if ((block)&&(drag.length)&&(terminal)) {
                            if ((drag.length===1)||
                                (avoidBreakBefore(block))||
                                (avoidBreakAfter(drag[drag.length-1]))) {
                                if (drag.indexOf(block)<0) drag.push(block);}
                            else layout.drag=drag=[];}
                        ni++;}
                    // Update the prev pointer for terminals
                    if (terminal) {
                        layout.prev=prev=block;
                        layout.prevstyle=prevstyle=style;}}

                // Gather all the block-level elements inside a node,
                // recording which ones are terminals (don't have any
                // blocks within them)
                function gatherBlocks(node,blocks,terminals,styles,style){
                    if (node.nodeType!==1) return;
                    if (node.codexui) return;
                    if (!(style)) style=getStyle(node); 
                    if (((atomic)&&(atomic.match(node)))||
                        (style.display==='table-row')||
                        (avoidBreakInside(node,style))) {
                        if ((node.offsetHeight)&&(node.offsetHeight<(page_height*2))) {
                            blocks.push(node); styles.push(style);
                            terminals.push(node);
                            moveNode(node,false,true,crumbs);
                            checkTerminal(node);
                            return;}
                        else {
                            // If the node is really tall, ignore the
                            // avoid page break constraint
                            fdjtLog.warn("Forcing split of huge (%d) block %o",
                                         node.offsetHeight,node);
                            node.style.pageBreakInside="auto";
                            style=getStyle(node);}}
                    var disp=style.display;
                    if ((style.position==='static')&&
                        (node.tagName!=="BR")&&
                        (disp!=='inline')&&
                        (disp!=='table-row')&&
                        (disp!=='table-cell')) {
                        var loc=blocks.length;
                        blocks.push(node);
                        styles.push(style);
                        terminals.push(false);
                        if ((disp==='block')||(disp==='table')||
                            (disp==='table-row-group')) {
                            var children=node.childNodes;
                            var total_blocks=blocks.length;
                            var i=0; var len=children.length;
                            while (i<len) {
                                gatherBlocks(children[i++],
                                             blocks,terminals,styles);}
                            if (blocks.length===total_blocks)
                                terminals[loc]=node;}
                        else terminals[loc]=node;
                        if (terminals[loc]) checkTerminal(node);
                        moveNode(node,false,true,crumbs);}
                    else if ((style.position==='static')&&(node.tagName==='A')) {
                        var anchor_elts=node.childNodes;
                        var j=0; var n_elts=anchor_elts.length;
                        while (j<n_elts) {
                            var child=anchor_elts[j++];
                            if (child.nodeType!==1) continue;
                            var cstyle=getStyle(child);
                            if (cstyle.display!=='inline')
                                gatherBlocks(child,blocks,terminals,
                                             styles,cstyle);}
                        moveNode(node,false,true,crumbs);}
                    else {}}

                function handle_dragging(block,terminal,style,tracing){
                    // If this block is terminal and we don't want to
                    // break before this block or after the preceding
                    // block, drag along the previous block to the new
                    // page.
                    
                    // NOTE that dragged blocks have already been
                    // placed, so the previous page will end up short.
                    // Them's the breaks (so to speak).
                    if ((block)&&(terminal)&&(avoidBreakBefore(block,style))) {
                        if (tracing) logfn("Possibly dragging %o",prev);
                        if ((prev)&&(drag.indexOf(prev)<0)) drag.push(prev);}
                    else if ((block)&&(prev)&&
                             (avoidBreakAfter(prev,prevstyle))) {
                        if (tracing) logfn("Possibly dragging %o",prev);
                        if ((prev)&&(drag.indexOf(prev)<0)) drag.push(prev);}
                    else if (drag.length) layout.drag=drag=[];
                    else {}}

                function handle_standalone(block,style,tracing){
                    if ((hasClass(block,/\bcodexfloatpage\b/))||
                        ((floatblocks)&&(testNode(block,floatblocks)))||
                        ((floatpages)&&(testNode(block,floatpages)))) {
                        // Float pages just get pushed (until newPage below)
                        if (tracing) logfn("Pushing float page %o",block);
                        floating.push(block);
                        return false;}
                    else if (checkSinglePage(block,style)) {
                        // Single pages automatically get their own page
                        if (tracing) logfn("Full single page for %o",block);
                        block=newPage(block); newPage();
                        return false;}
                    else if ((page.childNodes.length)&&
                             ((forcedBreakBefore(block,style))||
                              ((prev)&&(forcedBreakAfter(prev,prevstyle)))||
                              ((prev)&&
                               ((hasClass(prev,/\b(codexfullpage|codexsinglepage)\b/))||
                                ((fullpages)&&(testNode(prev,fullpages)))||
                                ((singlepages)&&(testNode(prev,singlepages))))))) {
                        // This is the easy case.  Note that we don't
                        // force a page break if the current page is
                        // empty.
                        if (tracing) logfn("Forced new page for %o",block);
                        // We clear the drags because we're following a force rule
                        layout.drag=drag=[];
                        return newPage(block)||block;}
                    else return moveNode(block);}

                function handle_unbreakable(block,style,geom,tracing) {
                    // We can't break this block (for various reasons)
                    var curpage=page; tracing=false; // ignored
                    if ((drag.length)&&(badBreak(drag[0],page))) {
                        // A new page won't make a difference
                        //  because we're dragging the rest of
                        //  the current page anyway, so we
                        //  need to make some choices (we're
                        //  in an impossible situation)
                        var oversize_limit=0.2;
                        if ((!(avoidBreakAfter(block,style)))&&
                            (((geom.bottom-page_height)/page_height)>1.0)&&
                            (((geom.bottom-page_height)/page_height)<oversize_limit)) {
                            // We leave the block where it is and create an oversize page
                            // We do this if:
                            //   a break after the block is okay AND
                            //    the page would be less than 20% oversize
                            addClass(page,"codexoversize"); // probably redundant
                            layout.drag=drag=[]; newPage();
                            return false;}
                        else {
                            // We need to leave the dragged elements behind
                            layout.drag=drag=[]; block=newPage(block)||block;
                            if (page===curpage)
                                return false; // probably "codexoversize"
                            else return block;}}
                    else {
                        // We just make a new page for the block
                        // return newPage(block);
                        block=newPage(block)||block;
                        if (page===curpage)
                            return false; // probably "codexoversize"
                        else return block;}}

                function badBreak(node,page){
                    if (atPageTop(node,page)) return true;
                    else {
                        var geom=getGeom(node,page);
                        if (geom.top<(page_height*0.7)) return true;
                        else return false;}}
                
                function checkAvoidBreakBefore(scan,root){
                    if (scan.nodeType===1) {
                        if (avoidBreakBefore(scan)) {
                            if (scan!==root)
                                addClass(root,"avoidbreakbefore");
                            return true;}
                        var children=scan.childNodes;
                        var i=0, lim=children.length;
                        while (i<lim) {
                            var child=children[i++];
                            if (child.nodeType===3) {
                                if (isEmpty(scan.value)) {}
                                else return true;}
                            else if (child.nodeType===1)
                                return checkAvoidBreakBefore(child,root);
                            else {}}
                        return false;}
                    else return false;}

                function checkForceBreakBefore(scan,root){
                    if (scan.nodeType===1) {
                        if (forcedBreakBefore(scan)) {
                            if (scan!==root)
                                addClass(root,"forcebreakbefore");
                            return true;}
                        var children=scan.childNodes;
                        var i=0, lim=children.length;
                        while (i<lim) {
                            var child=children[i++];
                            if (child.nodeType===3) {
                                if (isEmpty(scan.value)) {}
                                else return true;}
                            else if (child.nodeType===1)
                                return checkForceBreakBefore(child,root);
                            else {}}
                        return false;}
                    else return false;}

                function checkAvoidBreakAfter(scan,root){
                    if (scan.nodeType===1) {
                        if (avoidBreakAfter(scan)) {
                            if (scan!==root)
                                addClass(root,"avoidbreakafter");
                            return true;}
                        var children=scan.childNodes;
                        var i=children.length-1;
                        while (i>=0) {
                            var child=children[i--];
                            if (child.nodeType===3) {
                                if (isEmpty(scan.value)) {}
                                else return true;}
                            else if (child.nodeType===1) 
                                return checkAvoidBreakAfter(child,root);
                            else {}}
                        return false;}
                    else return false;}
                
                function checkForceBreakAfter(scan,root){
                    if (scan.nodeType===1) {
                        if (forcedBreakAfter(scan)) {
                            if (scan!==root)
                                addClass(root,"forcebreakafter");
                            return true;}
                        var children=scan.childNodes;
                        var i=children.length-1;
                        while (i>=0) {
                            var child=children[i--];
                            if (child.nodeType===3) {
                                if (isEmpty(scan.value)) {}
                                else return true;}
                            else if (child.nodeType===1)
                                return checkForceBreakAfter(child,root);
                            else {}}
                        return false;}
                    else return false;}

                function checkTerminal(node){
                    if (hasClass(node,"codexterminal")) return;
                    checkAvoidBreakBefore(node,node);
                    checkForceBreakBefore(node,node);
                    checkAvoidBreakAfter(node,node);
                    checkForceBreakAfter(node,node);
                    addClass(node,"codexterminal");}
                
                function firstGChild(ancestor,descendant){
                    var first=ancestor.firstChild;
                    while (first) {
                        if ((first.nodeType===3)&&
                            (first.nodeValue.search(/\S/)>=0))
                            return false;
                        else if (first.nodeType===1) break;
                        else first=first.nextSibling;}
                    if (!(first)) return false;
                    else if (first===descendant) return true;
                    else return firstGChild(first,descendant);}

                // Whether we need to create a new page to have 'node'
                //  at the page top We don't need a new page if the
                //  current page has no content or no content up until
                //  the node in question
                function needNewPage(node){
                    if (!(page)) return true;
                    else if ((!(node))||(!(hasParent(node,page))))
                        return hasContent(page,true);
                    else if ((page.firstChild===node)||(firstGChild(page,node)))
                        return false;
                    else if ((getGeom(node,page).top===0)&&(node.tagName!=="BR"))
                        return false;
                    else return true;}

                /*** Create a new page. ***/
                // If node is passed, it is intended to be the first
                // element on the new page.
                function newPage(node,forcepage){
                    var i, lim;
                    if ((drag)&&(drag.length)&&(drag.length)&&
                        (atPageTop(drag[0]))) {
                        logfn("Ignored call for new page @%d due to excessive drag",
                              pagenum);
                        if (node) node=moveNode(node);
                        return false;}
                    if ((!(node))&&(!(forcepage))&&(page)&&
                        (page.childNodes.length===0)) {
                        if (node)
                            logfn("Ignored call for new page for %o on empty page %d",
                                  node,pagenum);
                        else logfn("Ignored call for new page on empty page %d",
                                   node,pagenum);
                        return false;}

                    if ((node)&&(node.nodeType===3)) {
                        var parent=node.parentNode;
                        if ((parent)&&(parent.childNodes.length===1)&&
                            (parent!==document.body)&&
                            (parent!==root)&&
                            (!(hasClass(parent,"codexpage"))))
                            node=parent;}

                    if ((node)&&(!(forcepage))&&(!(needNewPage(node)))) {
                        return moveNode(node);}

                    if ((floating)&&(floating.length)) {
                        // First add any floating pages that may have
                        // accumulated
                        var floaters=floating; floating=[];
                        var closed_page=page;
                        i=0; lim=floaters.length;
                        while (i<lim) {
                            var floater=floaters[i++], fg=false;
                            if (checkSinglePage(floater)) {
                                newPage(floater);
                                closed_page=page;
                                forcepage=true;}
                            else if (closed_page===page) {
                                newPage(floater); fg=getGeom(floater,page);
                                if (fg.bottom>page_height) {
                                    addClass(page,"codexoversize");
                                    closed_page=page;}}
                            else {                                
                                moveNodeToPage(floater,page);
                                fg=getGeom(floater,newpage);
                                if (fg.bottom>=page_height) newPage(floater);}}}

                    if ((!(node))||(forcepage)||(needNewPage(node))) {
                        // If we really need to create a new page, do so,
                        if (page) {
                            if (pagefn) pagefn.call(layout,page,layout);
                            page.style.height="";
                            dropClass(page,"codexworkpage");}
                        layout.page=page=fdjtDOM("div.codexpage.codexworkpage");
                        newpages.push(page);
                        if (!(pagerule)) {
                            page.style.height=page_height+'px';
                            page.style.width=page_width+'px';}
                        page.style.height="inherit";
                        pagenum++; layout.pagenum=pagenum;
                        page.id=pageprefix+(pagenum);
                        page.setAttribute("data-pagenum",pagenum);
                        fdjtDOM(container,page);
                        layout.prev=prev=false;
                        pages.push(page);}
                    
                    if (trace) {
                        if ((trace>2)||
                            ((track)&&(node)&&(track.match(node)))) {
                            if (node) logfn("Layout/%s %o at %o",
                                            newpage,page,node);
                            else logfn("Layout/%s %o",newpage,page);}}
                    
                    // If there are things we are dragging along, move
                    // them to the new page
                    if ((drag)&&(drag.length)) {
                        i=0; lim=drag.length;
                        while (i<lim) moveNode(drag[i++],crumbs);
                        if (node) { /* node */
                            var block=node, terminal=((terminals)&&(terminals[ni]));
                            if ((block)&&(drag.length)&&(terminal)) {
                                if ((drag.length===1)||
                                    (avoidBreakBefore(block))||
                                    (avoidBreakAfter(drag[drag.length-1]))) {
                                    if (drag.indexOf(block)<0) drag.push(block);}
                                else layout.drag=drag=[];}}
                        else {
                            layout.prev=prev=drag[drag.length-1];
                            layout.drag=drag=[];}}
                    if (node) return moveNode(node);
                    else return false;}

                // This gets a little complicated
                function splitBlock(node,style){
                    if (!(style)) style=getStyle(node);
                    if ((!(break_blocks))||(avoidBreakInside(node,style))||
                        (!(node.childNodes))||(node.childNodes.length===0)) {
                        // Simplest case, if we can't split, we just
                        // make a new page starting with the node.
                        addClass(node,"codexcantsplit");
                        newPage(node);
                        return node;}
                    // Otherwise, we remove all of the node's children
                    // and then add back just enough to reach the
                    // edge, potentially splitting some children to
                    // make this work.
                    var init_geom=getGeom(node,page,true);
                    var line_height=init_geom.line_height||12;
                    var use_height=page_height;
                    if (((init_geom.top+init_geom.top_margin+
                          (line_height*1.5))>page_height)) {
                        // If the top is too close to the bottom of
                        // the page, try to just push onto a new page.
                        // This might fail if we're dragging too many
                        // nodes or if we're already the top of the page;
                        var cpage=page, newblock=newPage(node);
                        // If the page break succeeded, return the new block,
                        //  otherwise, keep trying to split
                        if (cpage!==page) return newblock;
                        // If we're near the bottom and the page break
                        // failed, we're in a tight place, so we bump
                        // up the height to let us go a little over
                        // (we'll adjust afterwards).
                        else use_height=page_height+floor(line_height*1.5);}
                    // Copy all the children into an array
                    var children=toArray(node.childNodes);
                    // and remove all of them at once
                    node.innerHTML="";
                    var geom=getGeom(node,page);
                    if (geom.bottom>use_height) {
                        // If the version without any children is
                        // already over the edge, just start a new
                        // page on the node (after restoring all the
                        // children to the node).
                        appendChildren(node,children);
                        addClass(node,"codexcantsplit");
                        newPage(node);
                        return node;}
                    // If the block is just a little bit over the
                    // bottom, tweak the page height to avoid leaving
                    // a single line on the other side, except if the
                    // overall height is small.
                    if ((use_height===page_height)&&
                        ((init_geom.bottom-page_height)<(line_height*1.5))&&
                        (init_geom.height>(line_height*3)))
                        use_height=page_height-floor(line_height*1.5);
                    // When splitChildren called, <node> is already empty and it's
                    // children are all in <children>
                    var push=splitChildren(node,children,init_geom,use_height);
                    if (!(push)) {
                        /* Doesn't need to be split after all.
                           Not sure when this will happen, if ever. */
                        fdjtLog("Tried to break %o which didn't need breaking",
                                node);
                        appendChildren(node,children);
                        return node;}
                    else if (push===node) {
                        // This is the case where we can't split at
                        //  all, so we add the class 'codexcantsplit'
                        //  to avoid trying again and we make a new
                        //  page
                        appendChildren(node,children);
                        addClass(node,"codexcantsplit");
                        newPage(node);
                        return node;}
                    else { 
                        var page_break=push[0];
                        // Since we left something behind on this page, we
                        //  can clear anything we're dragging
                        layout.drag=drag=[];
                        // Finally, we create a new page
                        page_break=newPage(page_break);
                        var dup=page_break.parentNode;
                        // This (dup) is the copied parent of the page
                        // break.  We append all the remaining children
                        // to this duplicated parent on the new page.
                        appendChildren(dup,push,1);
                        if (trace>1)
                            logfn("Layout/splitBlock %o @ %o into %o on %o",
                                  node,page_break,dup,page);
                        return dup;}}

                function splitChildren(node,children,init_geom,use_page_height){
                    /* node is an emptied node and children are its
                       lost children.  We return an array of children
                       which should go onto the next page, possibly
                       synthesizing a new child by splitting some
                       text.  Returning false means that the node
                       should be left on its page; returning the node
                       itself indicates that it should be forced onto
                       a new page. */
                    var page_break=false, breaktype=false, breakpos=-1; 
                    var textsplit=false, text_parent=false;
                    if (!(use_page_height)) use_page_height=page_height;
                    // This is always called from splitBlock or the
                    //  break point in splitChildren, so we know that
                    //  node by itself is on the page while node with
                    //  it's children is over the page.
                    var geom=init_geom||getGeom(node,page);
                    // We add children back until we go over the edge
                    // and then figure out if there's a way to split
                    // the child that broke the page.
                    var i=0, n=children.length, child;
                    while (i<n) {
                        var child=children[i++];
                        node.innerHTML="";
                        appendChildren(node,children,0,i);
                        // Add the child back and get the geometry
                        geom=getGeom(node,page);
                        if (geom.bottom>use_page_height) {
                            page_break=child; breaktype=child.nodeType; breakpos=i-1;
                            break;}
                        else continue;}
                    if (!(page_break))  // Never went over the edge
                        return false;
                    // If we get here, this child pushed the node over the edge
                    else if (breaktype===3) {
                        textsplit=page_break; text_parent=node;}
                    else if (breaktype!==1) {
                        //  It's a weird node, so we punt on handling it.
                        //  If it's the first child, push the whole node,
                        //  otherwise, just split it at the break
                        if (breakpos===0) return node;
                        else return children.slice(breakpos);}
                    // If the page break has a single textual child, we just split
                    // it's text.
                    else if ((page_break.childNodes.length===1)&&
                             (page_break.childNodes[0].nodeType===3)) {
                        textsplit=child.childNodes[0];
                        text_parent=page_break;}
                    // If we're breaking on the first node or there
                    // isn't any real content before the break, we
                    // admit defeat
                    else if ((breakpos===0)||(!(hasContent(node,true,false,page_break)))) {
                        appendChildren(node,children,i);
                        return node;}
                    // If the break is childless, we just split on it
                    else if ((!(page_break.childNodes))||
                             (page_break.childNodes.length===0))
                        return children.slice(breakpos);
                    else if (true) return children.slice(breakpos);
                    // We could call splitChildren recursively, but
                    // we're not currently doing so
                    else {
                        /*
                        var grandchildren=toArray(page_break.childNodes);
                        var push=splitChildren();
                        if ((!(push))||(push===page_break))
                            return children.slice(i-1);
                        else {
                            // This should reproduce the logic below
                            var clone_break=page_break.cloneNode(true);}
                        */
                    }
                    // If it's text, split it into words, then try to
                    // find the length at which one more word pushes
                    // it over the edge.
                    var probenode=textsplit, text=textsplit.nodeValue;
                    var original=textsplit;
                    // Now, break the text up at possible page breaks
                    // (we are not treating soft-hyphens as page breaks, though we might)
                    var words=attachWhitespace(text.split(/(\s+)/mg));
                    // If there aren't many words, don't bother splitting
                    if (words.length<2) {
                        // If the break is at the head, push the whole
                        // node to the next page, otherwise, 
                        if (i===1) return node;
                        else return children.slice(breakpos);}
                    else {
                        // Check if just the first word pushes us over
                        // the edge, a relatively common case
                        var wprobe=document.createTextNode(words[0]);
                        text_parent.replaceChild(wprobe,probenode); probenode=wprobe;
                        geom=getGeom(node,page);
                        if (geom.bottom>use_page_height) {
                            text_parent.replaceChild(original,probenode);
                            return children.slice(breakpos);}}
                    var foundbreak=splitWords(text_parent,probenode,words,node,use_page_height);
                    // We're done searching for the word break
                    if ((foundbreak===0)||(foundbreak===(words.length-1))) {
                        // Don't actually do any text splitting
                        text_parent.replaceChild(textsplit,probenode);
                        if (breakpos===0) return node;
                        else return children.slice(breakpos);}
                    else { // Split the text at foundbreak
                        var keeptext=words.slice(0,foundbreak).join("");
                        var pushtext=words.slice(foundbreak).join("");
                        // We record the ID so that we can restore the
                        // original text node
                        var keepnode, pushnode, id=false;
                        if (breaktype===3) {
                            // We replace the text with an element so
                            //  that we can look it up by ID to replace
                            //  when reverting the layout.
                            keepnode=fdjtDOM("span.codexsplitstart");
                            id=keepnode.id="CODEXTMPID"+(tmpid_count++);
                            pushnode=fdjtDOM("span.codextextsplit");}
                        else if (hasClass(page_break,"codextextsplit")) {
                            // No need to save anything and we don't
                            // want nested codextextsplits.  So we use
                            // the page_break as the keepnode and set
                            // up probenode and text_parent as though
                            // the page break were a text node being
                            // probed.
                            probenode=keepnode=page_break;
                            keepnode.innerHTML="";
                            text_parent=node; probenode=keepnode;
                            pushnode=page_break.cloneNode(true);
                            pushnode.id="";}
                        else {
                            keepnode=fdjtDOM("span.codexsplitstart");
                            pushnode=page_break.cloneNode(true);
                            if (!(keepnode.id))
                                id=keepnode.id="CODEXTMPID"+(tmpid_count++);
                            else pushnode.id="";}
                        keepnode.appendChild(document.createTextNode(keeptext));
                        // Avoid a ragged bottom line on keepnode
                        addDupLeading(node);
                        pushnode.appendChild(document.createTextNode(pushtext));
                        if (keepnode!==probenode)
                            text_parent.replaceChild(keepnode,probenode);
                        // Gather the children to be pushed, replacing
                        // the first one with the duplicated page_break
                        var push_children=children.slice(breakpos);
                        push_children[0]=pushnode;
                        // Put the children back into context for copying
                        appendChildren(node,push_children);
                        // Save the textsplit for reverting the layout
                        if (id) textsplits[id]=original;
                        // Return the children to be pushed to the new page
                        return push_children;}}

                function splitWords(text_parent,probestart,words,node,use_page_height){
                    // Now we do a binary search to find the word
                    //  which pushes the node below the page bottom.
                    //  That's where we'll break.
                    var wlen=words.length, wtop=wlen, wbot=0, foundbreak=false;
                    var probenode=probestart;
                    while (wbot<wtop) {
                        var wmid=wbot+floor(wtop-wbot);
                        var newprobe=document.createTextNode(
                            words.slice(0,wmid).join(""));
                        // Add all the words up to foundbreak
                        text_parent.replaceChild(newprobe,probenode);
                        probenode=newprobe; geom=getGeom(node,page);
                        if (geom.bottom>use_page_height)
                            wtop=wmid-1;
                        else {
                            /* Add the word at foundbreak to see if we break the page.
                               This is the actual test condition. */
                            var nextw=document.createTextNode(words[foundbreak]);
                            text_parent.appendChild(nextw);
                            var ngeom=getGeom(node,page);
                            text_parent.removeChild(nextw);
                            if (ngeom.bottom>use_page_height) {
                                foundbreak=wmid; break;}
                            else wbot=wmid+1;}}
                    if (foundbreak===false) foundbreak=wbot;
                    if (probestart!==probenode)
                        text_parent.replaceChild(probestart,probenode);
                    return foundbreak;}

                // This attaches trailing whitespace to words as returned by .split()
                function attachWhitespace(breaks){
                    var words=[], word=false;
                    var bi=0, blen=breaks.length;
                    while (bi<blen) {
                        var s=breaks[bi++]; var ws;
                        if ((ws=s.search(/\s/))>=0) { /* Includes whitespace */
                            if (ws===0) { /* Starts with whitespace */
                                if (word) words.push(word);
                                if (bi<blen) word=s+breaks[bi++];
                                else word=s;}
                            else {
                                if (word) words.push(word+s);
                                else words.push(s);
                                word=false;}}
                        else if (word) word=word+s;
                        else word=s;}
                    if (word) words.push(word);
                    return words;}

                function loop(){
                    var loop_start=fdjtTime();
                    while ((ni<nblocks)&&
                           ((!(timeslice))||
                            ((fdjtTime()-loop_start)<timeslice)))
                        step();
                    if (progressfn) progressfn(layout);
                    if (ni<nblocks) {
                        if (timeslice)
                            layout.timer=setTimeout(loop,timeskip||timeslice);
                        else loop();}
                    else {
                        var last_block=blocks[nblocks-1];
                        if ((forcedBreakAfter(last_block))||
                            (hasClass(last_block,/\bcodexfullpage\b/))||
                            ((fullpages)&&(testNode(last_block,fullpages))))
                            newPage();
                        if (layout.timer) clearTimeout(layout.timer);
                        layout.timer=false;
                        layout.root=cur_root=false;
                        pagesDone(newpages); newpages=[];
                        if (donefn) {
                            if (timeslice) 
                                setTimeout(function(){donefn(layout);},10);
                            else donefn(layout);}}}

                // This is the inner loop
                if (!(timeslice)) {
                    while (ni<nblocks) step();
                    pagesDone(newpages);
                    if (donefn) donefn(layout);}
                else loop();
                
                return layout;}
            this.addContent=addContent;

            function pagesDone(pages){
                var i=0, lim=pages.length; while (i<lim) {
                    var page=pages[i++];
                    if (page.style.height) continue;
                    if (hasClass(page,"codexoversize")) continue;
                    page.style.height="auto"; page.style.display="block";
                    if (page.offsetHeight>page_height)
                        addClass(page,"codexoversize");
                    page.style.height=""; page.style.display="";}}

            function gatherLayoutInfo(node,ids,dups,dupids,dupstarts,restoremap){
                if (node.nodeType!==1) return;
                var classname=node.className;
                if (typeof classname === "string") {
                    if (classname.search(/\bcodexdupstart\b/)>=0) {
                        if (!(dupstarts[node.id])) {
                            dupstarts[node.id]=node;
                            dupids.push(node.id);
                            ids.push(node.id);}}
                    else if (classname.search(/\b(codexdup|codexdupend)\b/)>=0) {
                        var baseid=node.getAttribute("data-baseid");
                        if (baseid) {
                            node.codexbaseid=baseid;
                            if (dups[baseid]) dups[baseid].push(node);
                            else dups[baseid]=[node];}}
                    else if ((node.id)&&
                             (classname.search(/\bcodexrestore\b/)>=0)) {
                        if (!(restoremap[node.id])) {
                            ids.push(node.id);
                            restoremap[node.id]=node;}}}
                // Weird node
                else return;
                if ((node.childNodes)&&(node.childNodes.length)) {
                    var children=node.childNodes;
                    var i=0, lim=children.length;
                    while (i<lim) {
                        var child=children[i++];
                        if (child.nodeType===1) gatherLayoutInfo(
                            child,ids,dups,dupids,dupstarts,restoremap);}}}

            var replaceNode=fdjtDOM.replace;

            /* Setting content (when there's a saved version) Mostly
               this sets up the external data and functions which would
               have been generated if we'd gone through the layout,
               especially the dups for split nodes and the saved_ids
               for restoring unique IDs.
            */
            function setSimpleLayout(content,donefn){
                var frag=document.createElement("div");
                var all_ids=[], saved_ids={};
                var dupids=[], dupstarts={}, restoremap={};
                var curnodes=[], newdups={};
                fdjtLog("Setting layout to %d characters of HTML",
                        content.length);
                frag.innerHTML=content;
                var newpages=frag.childNodes, addpages=[];
                if (trace) fdjtLog("Gathering layout info");
                var i=0, lim=newpages.length; while (i<lim) {
                    var page=newpages[i++];
                    addpages.push(page);
                    if (page.nodeType===1) {
                        if ((page.className)&&(page.className.search)&&
                            (page.className.search(/\bcurpage\b/)>=0))
                            dropClass(page,"curpage");
                        gatherLayoutInfo(page,all_ids,newdups,
                                         dupids,dupstarts,restoremap);}}
                var idmap={};
                if (trace) fdjtLog("Getting originals by ID");
                i=0; lim=all_ids.length; while (i<lim) {
                    var idkey=all_ids[i++];
                    idmap[idkey]=document.getElementById(idkey);}
                var bcrumb=false, ccrumb=false;
                if (trace)
                    fdjtLog("Moving body and container out of document");
                if ((origin)&&(origin.parentNode)) {
                    bcrumb=document.createTextNode("");
                    origin.parentNode.replaceChild(bcrumb,origin);}
                if (container.parentNode) {
                    ccrumb=document.createTextNode("");
                    container.parentNode.replaceChild(ccrumb,container);}
                if (trace) fdjtLog("Moving originals into layout");
                i=0; lim=all_ids.length; while (i<lim) {
                    var id=all_ids[i++];
                    var original=idmap[id];
                    var restore=restoremap[id];
                    // The restoremap contains content references
                    //  which are unmodified from the original
                    //  content, making them a lot smaller and easier
                    //  to keep around.
                    if ((restore)&&(original)) {
                        var classname=restore.className;
                        var style=restore.getAttribute("style");
                        var ostyle=original.getAttribute("style");
                        var crumb=document.createTextNode("");
                        replaceNode(original,crumb);
                        crumbs[id]=crumb;
                        replaceNode(restore,original);
                        if (classname!==original.className) {
                            if ((original.className)&&
                                (typeof original.className === "string"))
                                original.setAttribute(
                                    "data-oldclass",original.className);
                            original.className=classname;}
                        if (style!==ostyle) {
                            if (ostyle) original.setAttribute(
                                "data-oldstyle",ostyle);
                            original.setAttribute("style",style);}}
                    else if (original) {
                        saved_ids[id]=original;
                        if (original.id) original.removeAttribute("id");}}
                if (trace) fdjtLog("Gathering lostids");
                var lostids=layout.lostids={};
                var really_lost=lostids._all_ids=[];
                i=0; lim=dupids.length; while (i<lim) {
                    var dupid=dupids[i++];
                    var orig=idmap[dupid];
                    if (orig) {
                        lostids[dupid]=orig;
                        really_lost.push(dupid);
                        if (orig.id) orig.removeAttribute("id");}}
                if (trace) fdjtLog("Moving nodes around");
                var cur=container.childNodes;
                i=0; lim=cur.length; while (i<lim) curnodes.push(cur[i++]);
                i=0; while (i<lim) container.removeChild(curnodes[i++]);
                i=0; lim=addpages.length;
                while (i<lim) container.appendChild(addpages[i++]);
                layout.pages=addpages;
                dups=layout.dups=newdups;
                saved_ids._all_ids=all_ids;
                layout.saved_ids=saved_ids;
                layout.page=addpages[0];
                layout.pagenum=parseInt(
                    layout.page.getAttribute("data-pagenum"),10);
                if (trace)
                    fdjtLog("Moving origin/container back to document");
                if (ccrumb)
                    ccrumb.parentNode.replaceChild(container,ccrumb);
                if (bcrumb)
                    bcrumb.parentNode.replaceChild(origin,bcrumb);
                if (trace) fdjtLog("Done restoring layout");
                if (donefn) donefn();}
            function setLayout(content,donefn){
                if (typeof content === "string") 
                    setSimpleLayout(content,donefn);
                else if (!(content.hasOwnProperty('npages'))) 
                    setSimpleLayout(content.layout,donefn);
                else {
                    container.innerHTML=content.layout;
                    var pagenodes=container.childNodes;
                    fdjtTime.slowmap(function(pagenode){
                        restorePage(pagenode,content);},
                                     pagenodes,false,donefn,
                                     layout.timeslice,
                                     layout.timeskip);}}
            layout.setLayout=setLayout;

            function restorePage(pagenode,content){
                fetchLayout(content.layout_id,function(pagedata){
                    pagenode.innerHTML=pagedata.content;},
                            pagenode.id);}

            function dropSelected(node,dropsel){
                if (!(dropsel)) return;
                else if (node.nodeType!==1) return;
                else {
                    var children=node.childNodes; var todrop=[];
                    if (!(children)) return;
                    var i=0, lim=children.length;
                    while (i<lim) {
                        var child=children[i++];
                        if (child.nodeType!==1) continue;
                        if (dropsel.match(child)) todrop.push(child);}
                    i=0; lim=todrop.length; while (i<lim) {
                        node.removeChild(todrop[i++]);}}}

            function prepForRestore(node,dropsel){
                if (node.nodeType!==1) return;
                if (node.id) {
                    var classname=node.className;
                    if ((!((classname)&&
                           (typeof classname === "string")&&
                           (classname.search(/\bcodexdup/g)>=0)))&&
                        (node.id)&&(node.id.search("CODEXTMP")!==0)) {
                        var justref=document.createElement(node.tagName);
                        if (node.id) justref.id=node.id;
                        if (typeof node.className === "string")
                            justref.className=node.className+" codexrestore";
                        else justref.className="codexrestore";
                        if (node.getAttribute("style"))
                            justref.setAttribute("style",node.getAttribute("style"));
                        node.parentNode.replaceChild(justref,node);
                        if (dropsel) return dropSelected(node,dropsel);
                        else return;}}
                var children=node.childNodes; var todrop=[];
                var i=0, n=children.length;
                while (i<n) {
                    var child=children[i++];
                    if (child.nodeType!==1) continue;
                    else if ((dropsel)&&(dropsel.match(child)))
                        todrop.push(child);
                    else prepForRestore(child,dropsel);}
                i=0; n=todrop.length; while (i<n) {
                    node.removeChild(todrop[i++]);}}
            
         
            function saveLayout(callback,layout_id,separated){
                var href=window.location.href;
                var qpos=href.indexOf("?"), hashpos=href.indexOf("#");
                var endpos=((qpos>=hashpos)?(qpos):(hashpos));
                if (endpos>0) href=href.slice(0,endpos);
                if (!(layout_id)) layout_id=layout.layout_id||
                    (layout.layout_id=layout.width+"x"+layout.height+"("+href+")");
                if (!(CodexLayout.cache)) return;
                // These will be used for per-page saved layouts
                // var setLocal=fdjtState.setLocal, getLocal=fdjtState.getLocal;
                var copy=container.cloneNode(true);
                var pages=copy.childNodes, i=0, npages=pages.length;
                var pageids=((separated)&&([])), pagecontent={};
                while (i<npages) {
                    var page=pages[i++];
                    if (page.nodeType===1) {
                        var content=page.childNodes;
                        var j=0, n=content.length;
                        while (j<n) {
                            var node=content[j++];
                            if (node.nodeType===1) {
                                prepForRestore(node,layout.dontsave||false);
                                if ((node.id)&&(pageids)) {
                                    pageids.push(node.id);
                                    pagecontent[node.id]=node.innerHTML;
                                    node.innerHTML="";}}}}}
                var html=copy.innerHTML;
                try {
                    if (pageids)
                        cacheLayout(layout_id,html,pageids,pagecontent);
                    else cacheLayout(layout_id,html);
                    gotLayout(layout_id);
                    callback(layout);}
                catch (ex) {
                    fdjtLog.warn("Couldn't save layout %s: %s",layout_id,ex);
                    return false;}
                return layout_id;}
            this.saveLayout=saveLayout;
            function restoreLayout(arg,donefn){
                function whendone(){
                    layout.done=fdjtTime();
                    if (donefn) donefn(layout);}
                if (!(arg)) {
                    fdjtLog.warn("Falsy arg %s to restoreLayout",arg);
                    return;}
                else if (arg.hasOwnProperty('npages')) {
                    layout.setLayout(arg,whendone);
                    return true;}
                else if (arg.hasOwnProperty('layout')) {
                    layout.setLayout(arg.layout,whendone);
                    return true;}
                else if (arg.indexOf("<")>=0) {
                    layout.setLayout(arg,whendone);
                    return true;}
                var saved_layout=fdjtState.getLocal(arg);
                if (layout) {
                    layout.setLayout(saved_layout,whendone);
                    return true;}
                else return false;}
            this.restoreLayout=restoreLayout;

            /*
              layout.savePages=function(){
              // This is a version which could be used if restore
              // the entire layout takes too long, which doesn't
              // seem to be the case.
              var pages=this.pages; var i=0, npages=pages.length;
              while (i<npages) {
              var page=pages[i++].cloneNode(true);
              var content=page.childNodes;
              var j=0, lim=content.length;
              while (j<lim) {
              var node=content[j++];
              if (node.nodeType===1) prepForRestore(node);}
              fdjtState.setLocal(layout_key+"#"+page.id,page.outerHTML);}};
            */


            // This is for setting individual page content, assuming
            // the page node already exists
            /*
              function setPageContent(content){
              var frag=document.createElement("div");
              frag.innerHTML=content;
              var newpage=frag.firstChild;
              var saved_ids=this.saved_ids||(this.saved_ids={});
              var all_ids=(saved_ids._all_ids)||(saved_ids._all_ids=[]);
              gatherLayoutInfo(newpage,all_ids,dups);
              var i=0, lim=all_ids.length; while (i<lim) {
              var id=all_ids[i++];
              var original=document.getElementById(id);
              if (original) {
              saved_ids[id]=original;
              original.id=null;}}
              var pagenum=parseInt(newpage.getAttribute("data-pagenum"),10);
              var curpage=document.getElementById(newpage.id);
              fdjtDOM.replace(curpage,newpage);
              if (this.page===curpage) this.page=newpage;
              pages[pagenum-1]=newpage;}
            */

            /* Finishing the page */

            var adjust_node=fdjtDOM.scaleToFit.adjust;
            function finishPage(completed) {
                addClass(completed,"codexworkpage"); 
                var undersize=hasClass(completed,"codexundersize");
                var oversize=hasClass(completed,"codexoversize");
                if (((oversize)||(undersize))&&(scale_pages)) {
                    addClass(completed,"codexworkpage");
                    var geom=getGeom(completed,false,true);
                    completed.style.height="inherit";
                    var iw=geom.inner_width, ih=geom.inner_height;
                    /*
                    tweakFont(completed,iw,ih,80,120);
                    // Get new geometry
                    geom=getGeom(completed,false,true);
                    */
                    iw=geom.inner_width; ih=geom.inner_height;
                    var ow=completed.offsetWidth, oh=completed.offsetHeight;
                    var noscale=((oversize)?
                                 ((oh<=ih)&&(ow<=iw)):
                                 ((oh<=ih)&&(ow<=iw)&&
                                  ((oh>(0.9*ih))||(ow>(0.9*iw)))));
                    if (!(noscale)) {
                        completed.style.height="";
                        adjust_node(completed);}}
                if (layout.pagedone) layout.pagedone(completed);
                dropClass(completed,"codexworkpage");
                completed.style.height="";}
            this.finishPage=finishPage;

            /* Finishing the overall layout */

            function Finish(){
                for (var dupid in dups)
                    if (dups.hasOwnProperty(dupid)) {
                        var alldups=dups[dupid];
                        var lastdup=alldups[alldups.length-1];
                        var dupstart=document.getElementById(dupid);
                        if (dupstart.tagName==="OL")
                            fixOrderedList([dupstart].concat(alldups));
                        if (dupstart.tagName==="LI") {
                            var dupi=0, ndups=alldups.length;
                            while (dupi<ndups) {
                                var dup=alldups[dupi++];
                                if (!(dup.getAttribute(dup,"data-oldstyle"))) 
                                    dup.setAttribute(
                                        "data-oldstyle",dup.getAttribute("style")||"");
                                dup.style.listStyleType="none";}}
                        lastdup.className=lastdup.className.replace(
                                /\bcodexdup\b/,"codexdupend");}
                var middle_dups=getChildren(page,".codexdup");
                if ((middle_dups)&&(middle_dups.length)) {
                    var j=0, dl=middle_dups.length; while (j<dl) {
                        var mdup=middle_dups[j++];
                        stripBottomStyles(mdup);}}
                if (page) {
                    if (pagefn) pagefn.call(layout,page,layout);
                    page.style.height="";
                    dropClass(page,"codexworkpage");}
                var i=0; var lim= pages.length;
                while (i<lim) {
                    var p=pages[i++];
                    this.finishPage(p);}
                layout.done=fdjtTime();}
            this.Finish=Finish;

            function fixOrderedList(ol){
                if (ol.length<2) return;
                var olpage=[]; var i=0, lim=ol.length, ntotal=0;
                while (i<lim) {
                    var dup=ol[i++];
                    var page=getParent(dup,".codexpage");
                    var pageno=(page)&&(parseInt(page.getAttribute("data-pagenum"),10));
                    olpage.push({list: dup,pageno:pageno});}
                olpage.sort(function(x,y){
                    if (x.pageno>y.pageno) return 1;
                    else if (x.pageno<y.pageno) return -1;
                    else return 0;});
                i=0; lim=olpage.length; while (i<lim) {
                    var olist=olpage[i++].list;
                    var new_items=countListItems(olist);
                    if (ntotal) addEmptyItems(olist,ntotal);
                    ntotal=ntotal+new_items;}}

            function addEmptyItems(root,count){
                var frag=document.createDocumentFragment();
                while (count>0) {
                    var item=fdjtDOM("LI","empty");
                    item.setAttribute(
                        "style",
                        "visibility: hidden !important; width: 0px !important; height: 0px !important; pointer-events: none;");
                    frag.appendChild(item);
                    count--;}
                if (root.firstChild) root.insertBefore(frag,root.firstChild);
                else root.appendChild(frag);}
            function countListItems(root,count){
                if (!(count)) count=0;
                var children=root.childNodes;
                var i=0, lim=children.length;
                while (i<lim) {
                    var child=children[i++];
                    if (child.nodeType===1) {
                        if ((child.tagName==="OL")||(child.tagName==="UL")) return count;
                        else if (child.tagName==="LI") count++;
                        else count=countListItems(child,count);}}
                return count;}

            /* page break predicates */
            
            function forcedBreakBefore(elt,style){
                if ((!(elt))||(elt.nodeType!==1)) return false;
                if (!(style)) style=getStyle(elt);
                return (style.pageBreakBefore==='always')||
                    ((elt.className)&&(elt.className.search)&&
                     (elt.className.search(
                             /\b(forcebreakbefore|alwaysbreakbefore)\b/)>=0))||
                    ((forcebreakbefore)&&(testNode(elt,forcebreakbefore)));}
            this.forcedBreakBefore=forcedBreakBefore;
            
            function forcedBreakAfter(elt,style){ 
                if ((!(elt))||(elt.nodeType!==1)) return false;
                if (!(style)) style=getStyle(elt);
                var force=(style.pageBreakAfter==='always')||
                    ((elt.className)&&(elt.className.search)&&
                     (elt.className.search(
                             /\b(forcebreakafter|alwaysbreakafter)\b/)>=0))||
                    ((forcebreakafter)&&(testNode(elt,forcebreakafter)));
                if (force) return force;
                if (elt===cur_root) return false;
                if (!(cur_root)) return false;
                var parent=elt.parentNode;
                if ((!(parent))||(parent===document))
                    return false;
                var last=(parent.lastElementChild)||
                    ((parent.children[parent.children.length-1]));
                if (elt===last)
                    return forcedBreakAfter(parent);
                else return false;}
            this.forcedBreakAfter=forcedBreakAfter;

            // We explicitly check for these classes because some browsers
            //  which should know better (we're looking at you, Firefox) don't
            //  represent (or handle) page-break 'avoid' values.  Sigh.
            var page_block_classes=/\b(avoidbreakinside)|(sbookpage)\b/;
            function avoidBreakInside(elt,style){
                if ((!(elt))||(elt.nodeType!==1)) return false;
                if (elt.tagName==='IMG') return true;
                if (!(style)) style=getStyle(elt);
                return (style.pageBreakInside==='avoid')||
                    (style.display==='table-row')||
                    ((elt.className)&&(elt.className.search)&&
                     (elt.className.search(page_block_classes)>=0))||
                    ((avoidbreakinside)&&(testNode(elt,avoidbreakinside)));}
            this.avoidBreakInside=avoidBreakInside;
            
            function avoidBreakBefore(elt,style){
                if ((!(elt))||(elt.nodeType!==1)) return false;
                if (!(style)) style=getStyle(elt);
                return ((style.pageBreakBefore==='avoid')||
                        ((elt.className)&&(elt.className.search)&&
                         (elt.className.search(/\bavoidbreakbefore\b/)>=0))||
                        ((avoidbreakbefore)&&(testNode(elt,avoidbreakbefore))));}
            this.avoidBreakBefore=avoidBreakBefore;

            function avoidBreakAfter(elt,style){
                var avoid=false;
                if ((!(elt))||(elt.nodeType!==1)) return false;
                // Avoid breaks after headings
                if (/H\d/.exec(elt.tagName)) return true;
                if (!(style)) style=getStyle(elt);
                // Use the style information
                if (style.pageBreakAfter==='avoid') return true;
                else if ((style.pageBreakAfter)&&
                         (style.pageBreakAfter!=="auto"))
                    return false;
                else avoid=((avoidbreakafter)&&(testNode(elt,avoidbreakafter)));
                if (avoid) return avoid;
                if (elt===cur_root) return false;
                if (!(cur_root)) return false;
                var parent=elt.parentNode;
                if ((!(parent))||(parent===document))
                    return false;
                var last=(parent.lastElementChild)||
                    ((parent.children[parent.children.length-1]));
                if (elt===last)
                    return avoidBreakAfter(parent);
                else return false;}
            this.avoidBreakAfter=avoidBreakAfter;
            
            function checkSinglePage(elt,style){
                if ((!(elt))||(elt.nodeType!==1)) return false;
                if ((hasClass("codexsinglepage"))||(hasClass("codexfullpage")))
                    return true;
                else {
                    if (!(style)) style=getStyle(elt);
                    return ((style.pageBreakBefore==='always')&&
                            (style.pageBreakAfter==='always')&&
                            (style.pageBreakInside==='avoid'));}}
            this.checkSinglePage=checkSinglePage;

            function getPage(spec) {
                if (!(spec)) return false;
                else if (typeof spec === 'number')
                    return fdjtID(pageprefix+spec);
                else if (spec.nodeType) {
                    if (hasClass(spec,"codexpage")) return spec;
                    else return getParent(spec,".codexpage");}
                else if (typeof spec === "string")
                    return getPage(fdjtID(spec));
                else {
                    logfn("Can't determine page from %o",spec);
                    return false;}}
            this.getPage=getPage;

            function getDup(node,page){
                if (typeof node === 'string')
                    node=document.getElementById(node);
                if (!(node)) return false;
                if (hasParent(node,page)) return node;
                var nodeid=node.id;
                var duptable=layout.dups;
                var dups=duptable[nodeid];
                var i=0; var lim=dups.length;
                while (i<lim) {
                    if (hasParent(dups[i],page)) return dups[i];
                    else i++;}
                return false;}
            this.getDup=getDup;

            function gotoPage(spec) {
                var newpage=false;
                if (!(spec)) return false;
                else if (typeof spec === 'number')
                    newpage=document.getElementById(pageprefix+spec);
                else if (spec.nodeType) {
                    if (hasClass(spec,"codexpage")) newpage=spec;
                    else newpage=getParent(spec,".codexpage");}
                else if (typeof spec === "string")
                    newpage=getPage(document.getElementById(spec));
                else {
                    logfn("Can't determine page from %o",spec);
                    return false;}
                if (!(newpage)) return;
                var curpages=container.getElementsByClassName('curpage');
                if (curpages.length) dropClass(toArray(curpages),"curpage");
                addClass(newpage,"curpage");}
            this.gotoPage=gotoPage;

            this.Revert=function(){
                var i, lim;
                if (this.saved_ids) {
                    // This means that the content was explicitly set,
                    //  so we just need to restore the saved ids and clear
                    //  out the container to revert.
                    var saved=this.saved_ids, allids=saved._all_ids;
                    var crumbs=this.crumbs;
                    i=0; lim=allids.length; while (i<lim) {
                        var id=allids[i++], original;
                        if (crumbs[id]) {
                            original=document.getElementById(id);
                            var oclass=original.getAttribute("data-oldclass");
                            var ostyle=original.getAttribute("data-oldstyle");
                            var crumb=crumbs[id];
                            if (oclass) {
                                original.className=oclass;
                                original.removeAttribute("data-oldclass");}
                            if (ostyle) {
                                original.setAttribute("style",ostyle);
                                original.removeAttribute("data-oldstyle");}
                            crumb.parentNode.replaceChild(original,crumb);}
                        else if (saved[id]) {
                            original=saved[id]; if (id) original.id=id;}
                        else {}}
                    var lost=this.lostids, lostids=lost._all_ids;
                    i=0; lim=lostids.length; while (i<lim) {
                        var lostid=lostids[i++];
                        if (lostid) lost[lostid].id=lostid;}
                    this.saved_ids={}; this.dups={}; this.lostids={};
                    return;}
                // Remove any scaleboxes (save the children)
                fdjtDOM.scaleToFit.revertAll();
                var pagetops=fdjtDOM.$(".codexpagetop");
                i=0; lim=pagetops.length;
                while (i<lim) {
                    var pt=pagetops[i++];
                    if (pt.getAttribute("data-oldstyle")) {
                        pt.setAttribute("style",pt.getAttribute("data-oldstyle"));
                        pt.removeAttribute("data-oldstyle");}
                    dropClass(pt,"codexpagetop");}
                revertLayout(this);};

            /* Finally return the layout */
            return this;}

        CodexLayout.timeslice=50;
        CodexLayout.timeskip=10;

        CodexLayout.tracelevel=0;
        CodexLayout.prototype.getDups=function getDups4ID(id){
            if (!(id)) return [];
            else if (id.nodeType) id=id.id;
            var base=fdjtID(id);
            var dups=this.dups[id];
            if (dups) return [base].concat(dups);
            else return false;};
        
        CodexLayout.prototype.getLayoutInfo=function getLayoutInfo(){
            var allblocks=this.allmoves;
            var npages=this.pages.length;
            var pages=new Array(npages+1);
            var pn=0; while (pn<=npages) pages[pn++]=[];
            var bn=0, blim=allblocks.length; while (bn<blim) {
                var block=allblocks[bn++];
                var page=getParent(block,".codexpage");
                if (page) {
                    var num=parseInt(page.getAttribute("data-pagenum"),10);
                    if (!(pages[num]))
                        fdjtLog.warn("weird page number: %o",num);
                    else {
                        var info={block: block};
                        if (block.id) info.id=block.id;
                        if (block.className) info.className=block.className;
                        if (block.getAttribute("data-baseid"))
                            info.baseid=block.getAttribute("data-baseid");
                        pages[num].push(info);}}
                else fdjtLog.warn("Can't find page for %o",block);}
            return pages;};

        CodexLayout.prototype.getLayoutBlocks=function getLayoutBlocks(){
            var allblocks=this.allblocks;
            var blockinfo=[];
            var i=0, lim=allblocks.length;
            while (i<lim) {
                var block=allblocks[i++];
                var page=getParent(block,".codexpage");
                var num=parseInt(page.getAttribute("data-pagenum"),10);
                var info={pagenum: num};
                var classname=block.className;
                if (block.id) info.id=block.id;
                if ((classname)&&(classname.search(/\bcodexdup/g)>=0)) 
                    info.html=block.outerHTML;
                else {
                    if (block.id) info.id=block.id;
                    if (classname.search(/\bcodexpagetop\b/)>=0)
                        info.pagetop=true;
                    if (classname.search(/\bcodexcantsplit\b/)>=0)
                        info.cantsplit=true;}
                blockinfo.push(info);}
            return {blocks: blockinfo, npages: this.pages.length,
                    height: this.height, width: this.width,
                    break_blocks: this.break_blocks};};

        CodexLayout.cache=2;

        var ondbinit=false;
        var dbinit_timeout=false;

        function indexedDB_timeout(){
            fdjtLog("Error initializing indexedDB");
            if (!(layoutDB)) {
                CodexLayout.layoutDB=layoutDB=window.localStorage;
                dbinit_timeout=false;
                if (ondbinit) ondbinit();}}

        var doinit=false;

        if (window.indexedDB) {
            var req=window.indexedDB.open("codexlayout",1);
            dbinit_timeout=setTimeout(indexedDB_timeout,15000);
            req.onerror=function(event){
                fdjtLog("Error initializing indexedDB layout cache: %o",
                        event.errorCode);
                if (dbinit_timeout) clearTimeout(dbinit_timeout);
                CodexLayout.layoutDB=layoutDB=window.localStorage;
                doinit=ondbinit; ondbinit=false;
                if (doinit) doinit();};
            req.onsuccess=function(event) {
                var db=event.target.result;
                if (CodexLayout.trace)
                    fdjtLog("Using existing indexedDB layout cache");
                if (dbinit_timeout) clearTimeout(dbinit_timeout);
                CodexLayout.layoutDB=layoutDB=db;
                CodexLayout.cache=7;
                doinit=ondbinit; ondbinit=false;
                if (doinit) doinit();};
            req.onupgradeneeded=function(event) {
                var db=event.target.result;
                if (dbinit_timeout) clearTimeout(dbinit_timeout);
                db.onerror=function(event){
                    fdjtLog("Unexpected error caching layouts: %d",
                            event.target.errorCode);
                    event=false; // ignored
                    CodexLayout.layoutDB=layoutDB=window.localStorage;
                    if (ondbinit) ondbinit();};
                db.onsuccess=function(event){
                    if (CodexLayout.trace)
                        fdjtLog("Initialized indexedDB layout cache");
                    event=false; // ignored
                    if (ondbinit) ondbinit();};
                db.createObjectStore("layouts",{keyPath: "layout_id"});
                CodexLayout.layoutDB=layoutDB=window.localStorage;
                doinit=ondbinit; ondbinit=false;
                if (doinit) doinit();};}
        else if (window.localStorage) {
            doinit=ondbinit; ondbinit=false;
            CodexLayout.layoutDB=layoutDB=window.localStorage;
            if (doinit) doinit();}
        else {
            CodexLayout.layoutDB=layoutDB=false;
            doinit=ondbinit; ondbinit=false;
            if (doinit) doinit();}

        function cacheLayout(layout_id,content,pageids,pages){
            var setLocal=fdjtState.setLocal;
            if (typeof layoutDB === "undefined") 
                ondbinit=function(){cacheLayout(layout_id,content);};
            else if (!(layoutDB)) return;
            else if ((window.Storage)&&(layoutDB instanceof window.Storage)) {
                setLocal(layout_id,content);
                if (pageids) {
                    setLocal(layout_id+".pageids",pageids);
                    var i=0, lim=pageids.length;
                    while (i<lim) {
                        var id=pageids[i++];
                        fdjtState.setLocal(layout_id+"#"+id,pages[id]);}}}
            else if (window.indexedDB) {
                var txn=layoutDB.transaction(["layouts"],"readwrite");
                var storage=txn.objectStore("layouts"), req;
                if (!(pageids)) {
                    req=storage.put({layout_id: layout_id,layout: content});
                    req.onerror=function(event){
                        fdjtLog("Error saving layout %s: %o",
                                layout_id,event.target.errorCode);};
                    req.onsuccess=function(event){
                        event=false; // ignored
                        if (CodexLayout.trace)
                            fdjtLog("Layout %s cached",layout_id);};}
                else {
                    var n=0, npages=pageids.length;
                    var putIDs=function putIDs(event){
                        event=false; // ignored
                        if (n<npages) {
                            var pageid=pageids[n++];
                            var pagecontent=pages[pageid];
                            storage.put(pageid,
                                        {layout_id: layout_id+"#"+pageid,
                                         content: pagecontent,
                                         pageno: n-1})
                                .onsuccess=putIDs;}
                        else if (CodexLayout.trace) 
                            fdjtLog("Layout %s cached",layout_id);};
                    req=storage.put({layout_id: layout_id,layout: content,
                                     pageids: pageids,npages: pageids.length});
                    req.onerror=function(event){
                        event=false; // ignored
                        fdjtLog("Error saving layout %s: %o",
                                layout_id,event.target.errorCode);};
                    req.onsucess=putIDs;}}
            else CodexLayout.layoutDB=layoutDB=window.localStorage||false;}
        CodexLayout.cacheLayout=cacheLayout;
        function dropLayout(layout_id){
            var layout=false, pageids=false, npages=false, n=0;
            if (layoutDB) {
                var txn=layoutDB.transaction(["layouts"],"readwrite");
                var storage=txn.objectStore("layouts");
                var req=storage.get(layout_id);
                var allDone=function allDone(event){
                    event=false; // ignored
                    var layouts=fdjtState.getLocal("fdjtCodex.layouts",true);
                    if (layouts) {
                        var loc=layouts.indexOf(layout_id);
                        if (loc>=0) {
                            layouts.splice(loc,1);
                            fdjtState.setLocal("fdjtCodex.layouts",layouts,true);}}
                    if (CodexLayout.trace)
                        fdjtLog("Layout %s removed",layout_id);};
                var whoops=function whoops(event) {
                    event=false; // ignored
                    fdjtLog("Error removing laytout %s",layout_id);};
                var dropRoot=function dropRoot(){
                    req=storage['delete'](layout_id);
                    req.onerror=whoops; req.onsuccess=allDone;};
                var dropPages=function dropPages(){
                    if ((npages)&&(n<npages)) {
                        var id=pageids[n++];
                        storage['delete'](id).onsuccess=dropPages;}
                    else dropRoot();};
                req.onerror=whoops;
                req.onsuccess=function(evt){
                    layout=((evt.target)&&(evt.target.result));
                    if ((layout)&&(layout.hasOwnProperty('pageids'))) {
                        pageids=layout.pageids;
                        npages=layout.npages;}
                    if (npages) dropPages();
                    else dropRoot();};}
            else {
                var dropLocal=fdjtState.dropLocal;
                pageids=fdjtState.listLocal(layout_id+"#");
                dropLocal(layout_id);
                dropLocal(layout_id+".pageids");
                var i=0, lim=pageids.length; while (i<lim) {
                    dropLocal(pageids[i++]);}
                var layouts=fdjtState.getLocal("fdjtCodex.layouts",true);
                if (layouts) {
                    var loc=layouts.indexOf(layout_id);
                    if (loc>=0) {
                        layouts.splice(loc,1);
                        fdjtState.setLocal("fdjtCodex.layouts",layouts,true);}}}}
        CodexLayout.dropLayout=dropLayout;
        function fetchLayout(layout_id,callback,pageid){
            var getLocal=fdjtState.getLocal;
            var content=false, layout_key=((pageid)?(layout_id+"#"+pageid):(layout_id));
            if (typeof layoutDB === "undefined") 
                ondbinit=function(){fetchLayout(layout_id,callback,pageid);};
            else if (!(layoutDB)) callback(false);
            else if ((window.Storage)&&(layoutDB instanceof window.Storage)) {
                var pageids=getLocal(layout_id+".pageids",true);
                if (pageids) {
                    gotLayout(layout_id);
                    content=getLocal(layout_id)||false;
                    if (pageid) {
                        var pnpos=layout_id.search(/\d+$/g);
                        var pagenum=parseInt(layout_id.slice(pnpos),10);
                        setTimeout(function(){
                            callback({content: content,pagenum: pagenum});},
                                   1);}
                    else setTimeout(function(){
                        callback({layout_id: layout_id,layout: content,
                                  pageids: pageids,npages: pageids.length});},
                                    1);}
                else {
                    content=getLocal(layout_id)||false;
                    if (content) gotLayout(layout_id);
                    setTimeout(function(){callback(content);},1);}}
            else if (layoutDB) {
                var txn=layoutDB.transaction(["layouts"]);
                var storage=txn.objectStore("layouts");
                var req=storage.get(layout_key);
                req.onsuccess=function(event){
                    var target=event.target;
                    var result=((target)&&(target.result));
                    if (result) gotLayout(layout_id);
                    if (!(result)) callback(false);
                    else if (result.hasOwnProperty('npages'))
                        callback(result);
                    else callback(result.layout);};}
            else if (window.localStorage) {
                content=fdjtState.getLocal(layout_key)||false;
                if (content) gotLayout(layout_id);
                setTimeout(function(){callback(content);},0);}}
        CodexLayout.fetchLayout=fetchLayout;
        
        CodexLayout.clearLayouts=function(){
            var layouts=fdjtState.getLocal("fdjtCodex.layouts",true);
            var i=0, lim=((layouts)&&(layouts.length)); 
            if (layouts) {
                while (i<lim) dropLayout(layouts[i++]);
                fdjtState.dropLocal("fdjtCodex.layouts");}};

        function fetchAll(callback){
            if (!(layoutDB)) return false;
            else {
                var txn=layoutDB.transaction(["layouts"],"read");
                var storage=txn.objectStore("layouts");
                var layout_ids=[];
                storage.openCursor().onsuccess=function(evt){
                    var cursor = evt.target.result;
                    if (cursor) {
                        layout_ids.push(cursor.key);
                        cursor['continue']();}
                    else callback(layout_ids);};}}
        CodexLayout.fetchAll=fetchAll;
        CodexLayout.clearAll=function(spec){
            fetchAll(function(layout_ids){
                var todrop=[]; var i=0, lim=layout_ids.length;
                if (!(lim)) {fdjtLog.warn("No layouts"); return;}
                else if (!(spec)) todrop=layout_ids;
                else while (i<lim) {
                    var id=layout_ids[i++];
                    if (id.search(spec)>=0) todrop.push(id);}
                if (todrop.length===0) {
                    fdjtLog.warn("No layouts match %s",spec);
                    return;}
                else if (spec)
                    fdjtLog.warn("Dropping %d layouts matching %s",
                                 todrop.length,spec);
                else fdjtLog.warn("Dropping %d layouts",todrop.length);
                i=0; lim=todrop.length; while (i<lim) {
                    fdjtLog.warn("Dropping layout %s",todrop[i]);
                    dropLayout(todrop[i++]);}});};
        function gotLayout(layout_id){
            var layouts=fdjtState.getLocal("fdjtCodex.layouts",true);
            if (!(layouts)) layouts=[layout_id];
            else if (layouts.indexOf(layout_id)<0) 
                layouts.push(layout_id);
            else {}
            fdjtState.setLocal("fdjtCodex.layouts",layouts,true);}
        
        return CodexLayout;})();


/* Mini Manual */
/*
  var layout=new CodexLayout();
  layout.addContent(node);
  layout.Finish();
  layout.Revert();

  var layout=new CodexLayout({
  page_width: 500, page_height: 500, // Dimensions
  // Where to add new pages; by default this creates a
  //  new div#CODEXPAGES.codexpages at the bottom of the BODY
  container: document.getElementByID("MYPAGES"),
  // Prefix for page element IDs, e.g. page 42 would have id MYCODEXPAGE42
  pageprefix: "MYCODEXPAGE",
  logfn: console.log, // how to log notable events
  // Layout rules:
  // Always put H1 elements on a new page
  forcebreakbefore: "H1",
  // Always follow div.signature with a page break
  forcebreakafter: "div.signature",
  // Avoid breaking inside
  avoidbreakinside: "div.code",
  // Avoid breaking before these elements
  avoidbreakbefore: "div.signature,div.attribution",
  // Avoid breaking after these elements
  avoidbreakafter: "h1,h2,h3,h4,h5,h6,h7",
  // Put this element on a page by itself
  codexfullpage: "div.titlepage",
  // Put this element on a page by itself, but don't interrupt the
  // narrative flow
  codexfloatpage: "div.illustration"});
*/

/* Emacs local variables
   ;;;  Local variables: ***
   ;;;  compile-command: "cd ..; make" ***
   ;;;  indent-tabs-mode: nil ***
   ;;;  End: ***
*/
