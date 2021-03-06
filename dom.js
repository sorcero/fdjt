/* -*- Mode: Javascript; -*- */

/* ######################### fdjt/dom.js ###################### */

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
var _fdjt_init;

fdjt.DOM=
    (function(){
        "use strict";
        var usenative=true;
        var fdjtString=fdjt.String;
        var fdjtLog=fdjt.Log;
        var aslice=Array.prototype.slice;

        var css_selector_regex=/((^|[.#])[^.#\[\s]+)|(\[[^ \]=]+=[^\]]+\])|(\[[^ \]=]+\])/ig;

        function fdjtDOM(spec){
            var node;
            if (spec.nodeType) node=spec;
            else if ((typeof spec==='string')&&(spec[0]==='<'))  {
                var container=document.createDocumentFragment();
                // We could do template expansion here
                container.innerHTML=spec;
                var children=container.childNodes;
                if (children.length===1) return children[0];
                else return container;}
            else if ((typeof spec==='string')&&(spec[0]==='#')&&
                     (node=document.getElementById(spec.slice(1)))) {}
            else if (typeof spec==='string') {
                var elts=spec.match(css_selector_regex);
                if (!(elts)) {
                    fdjtLog.warn("bad CSS spec");
                    return false;}
                var classname=false;
                node=document.createElement(elts[0]);
                var i=1; var len=elts.length;
                while (i<len) {
                    var sel=elts[i++];
                    if (sel[0]==='#') node.id=sel.slice(1);
                    else if (sel[0]==='.')
                        if (classname) classname=classname+" "+sel.slice(1);
                    else classname=sel.slice(1);
                    else if (sel[0]==='[') {
                        var eqpos=sel.indexOf('=');
                        if (eqpos<0) {
                            node.setAttribute(
                                sel.slice(1,sel.length-1),
                                sel.slice(1,sel.length-1));}
                        else {
                            var val=sel.slice(eqpos+1,sel.length-1);
                            if (((val[0]==="'")&&(val[val.length-1]==="'"))||
                                ((val[0]==='"')&&(val[val.length-1]==='"')))
                                val=val.slice(1,val.length-1);
                            node.setAttribute(sel.slice(1,eqpos),val);}}
                    else {}}
                if (classname) node.className=classname;}
            else {
                node=document.createElement(spec.tagName||"span");
                for (var attrib in spec) {
                    if (attrib==="tagName") continue;
                    else node.setAttribute(attrib,spec[attrib]);}}
            var j=1, lim=arguments.length; while (j<lim)
                domappend(node,arguments[j++]);
            return node;}

        fdjtDOM.useNative=function(flag) {
            if (typeof flag === 'undefined') return usenative;
            else usenative=flag;};
        
        fdjtDOM.clone=function(node){
            return node.cloneNode(true);};

        function getIE(){
            if (navigator.appName === 'Microsoft Internet Explorer') {
                var ua = navigator.userAgent;
                var re  = new RegExp("MSIE ([0-9]{1,}[\\.0-9]{0,})");
                var rv;
                if (re.exec(ua) !== null)
                    rv = parseFloat( re.$1 );
                else rv=1;
                // Fails for non-whole numbers
                if (rv<=0) rv=1;
                return rv;}
            else return 0;}

        fdjtDOM.ie=getIE();
        fdjtDOM.iem=Math.floor(fdjtDOM.ie);

        function fdjtID(id) {
            return ((id)&&
                    ((document.getElementById(id))||
                     ((id[0]==='#')&&
                      (document.getElementById(id.slice(1))))));}
        fdjt.ID=fdjtID;

        function domappend(node,content,i) {
            if (content===0) 
                node.appendChild(document.createTextNode("0"));
            else if (!(content)) return;
            else if (content.nodeType) node.appendChild(content);
            else if (typeof content === 'string') 
                node.appendChild(document.createTextNode(content));
            else if (content.toDOM)
                return domappend(node,content.toDOM());
            else if (content.toHTML)
                return domappend(node,content.toHTML());
            else if ((content.length)&&((!(i))||(i<content.length))) {
                var frag=(((window.DocumentFragment)&&
                           (node instanceof window.DocumentFragment))?
                          (node):(document.createDocumentFragment()));
                // We copy node lists because they're prone to change
                // underneath us as we're moving DOM nodes around.
                var elts=((window.NodeList)&&(content instanceof window.NodeList))?
                    (TOA(content)):(content);
                var len=elts.length; 
                if (typeof i === 'undefined') i=0;
                while (i<len) {
                    var elt=elts[i++];
                    if (typeof elt === 'string')
                        frag.appendChild(document.createTextNode(elt));
                    else if (typeof elt === 'number') 
                        frag.appendChild(document.createTextNode(elt.toString()));
                    else if (!(elt)) {}
                    else if (elt.nodeType) frag.appendChild(elt);
                    else if (elt.length)
                        domappend(frag,elt,0);
                    else if (elt.toDOM)
                        domappend(frag,elt.toDOM());
                    else if (elt.toHTML)
                        domappend(frag,elt.toHTML());
                    else if (elt.toString)
                        frag.appendChild(document.createTextNode(
                            elt.toString()));
                    else frag.appendChild(document.createTextNode(""+elt));}
                if (node!==frag) node.appendChild(frag);}
            else if (content.length) {}
            else node.appendChild(document.createTextNode(""+content));
            return node;}
        function dominsert(before,content,i) {
            var node=before.parentNode;
            if ((content.nodeType)&&(content===before))
                return;
            else if (content.nodeType)
                node.insertBefore(content,before);
            else if (typeof content === 'string') 
                node.insertBefore(document.createTextNode(content),before);
            else if (content.toDOM)
                return dominsert(before,content.toDOM());
            else if (content.toHTML)
                return dominsert(before,node,content.toHTML());
            else if (content.length-i>1) {
                var frag=(((window.documentFragment)&&
                           (node instanceof window.DocumentFragment))?
                          (node):(document.createDocumentFragment()));
                domappend(frag,content,i);
                node.insertBefore(frag,before);
                return before;}
            else if (content.length) {
                var c=content[i];
                if (c===before) return;
                else node.insertBefore(c,before);}
            else node.insertBefore(document.createTextNode(""+content),before);
            return node;}
        fdjtDOM.appendArray=domappend;
        
        function toArray(arg) {
            return aslice.call(arg);}
        fdjtDOM.toArray=toArray;
        function extendArray(result,arg) {
            var i=0; var lim=arg.length;
            while (i<lim) {result.push(arg[i]); i++;}
            return result;}
        function TOA(arg,start) {
            if ((arg.constructor === Array)||
                (arg instanceof Array)) {
                if (start) return arg.slice(start);
                else return arg;}
            else if (start)
                return aslice.call(arg,start||0);
            else return aslice.call(arg,start||0);}
        fdjtDOM.Array=TOA;
        fdjtDOM.slice=TOA;

        /* Wrapping children */
        function wrapChildren(node,spec){
            if (!(spec)) spec="div.fdjtwrapper";
            var wrapper=getFirstChild(node,spec);
            if ((wrapper)&&(wrapper.nodeType)&&
                (wrapper.parentNode===node))
                return wrapper;
            else wrapper=fdjtDOM(spec,toArray(node.childNodes));
            node.appendChild(wrapper);
            return wrapper;}
        fdjtDOM.wrapChildren=wrapChildren;
        function unwrapChildren(nodes,cxt){
            if (typeof nodes === "string") 
                nodes=((cxt)?(fdjt.DOM.getChildren(cxt,nodes)):
                       (fdjt.DOM.$(nodes)));
            else if (nodes.nodeType)
                nodes=[nodes];
            else {}
            var i=0, lim=nodes.length; while (i<lim) {
                var node=nodes[i++];
                var frag=document.createDocumentFragment();
                domappend(frag,toArray(node.childNodes));
                node.parentNode.replaceChild(frag,node);}}
        fdjtDOM.unwrapChildren=unwrapChildren;

        /* Utility patterns and functions */

        function parsePX(arg,dflt){
            if (typeof dflt === 'undefined') dflt=0;
            if (arg===0) return 0;
            else if (!(arg)) return dflt;
            else if (arg==="none") return dflt;
            else if (arg==="auto") return dflt;
            else if (typeof arg === 'number') return arg;
            else if (typeof arg === 'string') {
                var len=arg.length; var num=false;
                if ((len>2)&&(arg[len-1]==='x')&&(arg[len-2]==='p'))
                    num=parseInt(arg.slice(0,-2),10);
                else num=parseInt(arg,10);
                if (num===0) return 0;
                else if (isNaN(num)) return dflt;
                else if (typeof num === 'number') return num;
                else return dflt;}
            else return false;}
        fdjtDOM.parsePX=parsePX;

        function getLineHeight(node,style){
            if (!(style)) style=getStyle(node);
            var lh=style.lineHeight, fs=style.fontSize;
            if (!(lh)) return false;
            else if (lh.search(/px$/)>0) return parsePX(lh);
            else if (!(fs)) return false;
            else if (lh==="normal") return 1.2*parsePX(fs);
            else if (lh.search(/%$/)>0) 
                return (parseFloat(lh.slice(0,-1))/100)*(parsePX(fs));
            else if (parseFloat(lh))
                return parseFloat(lh)*parsePX(fs);
            else return parsePX(fs);}
        fdjtDOM.getLineHeight=getLineHeight;

        var whitespace_pat=/(\s)+/;
        var trimspace_pat=/^(\s)+|(\s)+$/;
        var classpats={};
        function classPat(name){
            var rx=new RegExp("\\b"+name+"\\b","g");
            classpats[name]=rx;
            return rx;}

        function string_trim(string){
            var start=string.search(/\S/); var end=string.search(/\s+$/g);
            if ((start===0) && (end<0)) return string;
            else return string.slice(start,end);}

        function nodeString(node){
            if (node.nodeType===3) 
                return "<'"+node.value+"'>";
            else if (node.nodeType===1) {
                var output="<"+node.tagName;
                if (node.id) output=output+"#"+node.id;
                if (node.tagName==='input') {
                    output=output+"[type="+node.type+"]";
                    output=output+"[name="+node.name+"]";}
                else if (node.tagName==='textarea')
                    output=output+"[name="+node.name+"]";
                else if (node.tagName==='img') {
                    if (node.alt) output=output+"[alt="+node.alt+"]";
                    else if (node.src) output=output+"[src="+node.src+"]";}
                else {}
                if (typeof node.className === "string")
                    output=output+"."+node.className.replace(/\s+/g,'.');
                return output+">";}
            else return node.toString();}
        fdjtDOM.nodeString=nodeString;
        
        /* Another way of making DOM elements which uses templates */

        function make(spec,content,data,init){
            var dom=fdjtDOM(spec);
            if (!(init)) init=data;
            if (data) content=fdjt.Template(content,data);
            if ((init.id)&&(!(dom.id))) dom.id=init.id;
            if ((init.title)&&(!(dom.title))) dom.title=init.title;
            if ((init.name)&&(!(dom.name))) dom.name=init.name;
            if ((init.href)&&(!(dom.href))) dom.href=init.href;
            if ((init.value)&&(!(dom.value))) dom.value=init.value;
            if ((init.src)&&(!(dom.src))) dom.src=init.src;
            if ((init.alt)&&(!(dom.alt))) dom.alt=init.alt;
            addListeners(dom,init);
            return dom;}
        fdjtDOM.make=make;

        /* Getting "values" of elements */
        function getElementValues(elt,spec,parse,multiple){
            var candidates=[];
            if (spec.search(/(\.|#|\[|,)/g)>=0) 
                candidates=getChildren(elt,spec);
            else if (elt.getElementsByClassName)
                candidates=elt.getElementsByClassName(spec);
            else candidates=getChildren();
            if (candidates.length===0) {
                if (multiple) return [];
                else return false;}
            else if (multiple) {
                var values=[];
                var i=0, lim=multiple.length;
                while (i<lim) {
                    var txt=candidates[i++].innerText;
                    if (parse) values.push(JSON.parse(txt));
                    else values.push(txt);}
                return values;}
            else if (parse)
                return JSON.parse(candidates[0].innerText);
            else return candidates[0].innerText;}
        fdjtDOM.getElementValues=getElementValues;
        function getElementValue(elt,spec,parse){
            return getElementValues(elt,spec,parse,false);}
        fdjtDOM.getElementValue=getElementValue;

        /* Simple class/attrib manipulation functions */

        function hasClass(elt,classname,attrib){
            if (!(elt)) return;
            else if (typeof elt === 'string') {
                if (!(elt=document.getElementById(elt)))
                    return;}
            var classinfo=((attrib) ? (elt.getAttribute(attrib)||"") :
                           (elt.className));
            if ((typeof classinfo !== "string")||(classinfo==="")) return false;
            else if (classname===true) return true;
            else if (classinfo===classname) return true;
            else if (typeof classname === 'string')
                if (classinfo.indexOf(' ')<0) return false;
            else classname=classpats[classname]||classPat(classname);
            else {}
            if (classinfo.search(classname)>=0) return true;
            else return false;}
        fdjtDOM.hasClass=hasClass;

        function addClass(elt,classname,attrib){
            if (!(elt)) return;
            else if (!(classname))
                return;
            else if (typeof elt === 'string') {
                if (!(elt=document.getElementById(elt)))
                    return;}
            else if ((window.NodeList)&&(elt instanceof window.NodeList))
                return addClass(TOA(elt),classname,attrib);
            else if ((elt.length)&&(!(elt.nodeType))) { // (assume array)
                var elts=TOA(elt);
                var i=0; var lim=elts.length;
                while (i<lim) addClass(elts[i++],classname,attrib||false);
                return;}
            else if ((!(attrib))&&(elt.classList)&&
                     (typeof classname ==="string")) {
                if (!(elt.classList.contains(classname)))
                    elt.classList.add(classname);
                return;}
            var classinfo=
                (((attrib) ? (elt.getAttribute(attrib)||"") :
                  (elt.className)) || null);
            if ((classinfo)&&(typeof classinfo !== "string")) {
                fdjtLog.warn("Non string classname for %o",elt);
                return false;}
            else if (!(classinfo)) {
                elt.className=classname; return true;}
            var class_regex=classpats[classname]||classPat(classname);
            var newinfo=classinfo;
            if (classinfo===classname) return false;
            else if (classinfo.search(class_regex)>=0) return false;
            else newinfo=classname+" "+classinfo;
            if (attrib) {
                elt.setAttribute(attrib,newinfo);
                // This sometimes trigger a CSS update that doesn't
                // happen otherwise
                elt.className=elt.className;}
            else elt.className=newinfo;
            return true;}
        fdjtDOM.addClass=addClass;
        fdjtDOM.aC=addClass;

        fdjtDOM.classAdder=function(elt,classname){
            return function() {
                if (elt) addClass(elt,classname);};};

        function dropClass(elt,classname,attrib,keep){
            if (!(elt)) return;
            else if (typeof elt === 'string') {
                if (!(elt=document.getElementById(elt)))
                    return;}
            else if ((window.NodeList)&&(elt instanceof window.NodeList))
                return dropClass(TOA(elt),classname,attrib);
            else if ((elt.length)&&(!(elt.nodeType))) {
                var elts=TOA(elt);
                var i=0; var lim=elts.length;
                while (i<lim) dropClass(elts[i++],classname,attrib||false);
                return;}
            else if ((!(attrib))&&(elt.classList)&&
                     (typeof classname ==="string")) {
                if (elt.classList.contains(classname))
                    elt.classList.remove(classname);
                return;}
            var classinfo=
                (((attrib) ? 
                  (elt.getAttribute(attrib)||"") :
                  (elt.className))||null);
            if ((typeof classinfo !== "string")||(classinfo===""))
                return false;
            var class_regex=
                ((typeof classname === 'string')?
                 (classpats[classname]||classPat(classname)):
                 classname);
            var newinfo=classinfo;
            if (classinfo===classname) 
                newinfo="";
            else if (classinfo.search(class_regex)>=0) 
                newinfo=classinfo.replace(class_regex,"");
            else return false;
            if (newinfo)
                newinfo=newinfo.
                replace(whitespace_pat," ").
                replace(trimspace_pat,"");
            if (attrib) {
                if (newinfo) {
                    elt.setAttribute(attrib,newinfo);
                    elt.className=elt.className;}
                else if (!(keep)) {
                    elt.removeAttribute(attrib);
                    elt.className=elt.className;}
                else {}}
            else if (newinfo)
                elt.className=newinfo;
            else if (!(keep))
                elt.className="";
            else elt.className="";
            return true;}
        fdjtDOM.dropClass=dropClass;
        fdjtDOM.dC=dropClass;

        fdjtDOM.classDropper=function(elt,classname){
            return function() {
                if (elt) dropClass(elt,classname);};};

        function swapClass(elt,drop,add,attrib) {
            dropClass(elt,drop,attrib); addClass(elt,add,attrib);}
        fdjtDOM.swapClass=swapClass;

        function setClass(elt,classname,add){
            if (typeof elt === 'string') elt=document.getElementById(elt);
            if (add) addClass(elt,classname);
            else dropClass(elt,classname);}
        fdjtDOM.setClass=setClass;

        function toggleClass(elt,classname,attrib,keep){
            if (typeof elt === 'string') elt=document.getElementById(elt);
            else if ((window.NodeList)&&(elt instanceof window.NodeList))
                return toggleClass(TOA(elt),classname,attrib);
            else if ((elt.length)&&(!(elt.nodeType))) {
                var elts=TOA(elt);
                var i=0; var lim=elts.length;
                while (i<lim) toggleClass(elts[i++],classname,attrib||false);
                return;}
            else if ((!(attrib))&&(elt.classList)&&
                     (typeof classname ==="string")) {
                elt.classList.toggle(classname);
                return;}
            var classinfo=
                (((attrib) ? 
                  (elt.getAttribute(attrib)||"") :
                  (elt.className))||null);
            if ((typeof classinfo !== "string")||(classinfo==="")) {
                if (attrib) elt.setAttribute(attrib,classname);
                else elt.className=classname;
                return true;}
            var class_regex=
                ((typeof classname === 'string')?
                 (classpats[classname]||classPat(classname)):
                 classname);
            var newinfo=classinfo;
            if (classinfo===classname) 
                newinfo="";
            else if (classinfo.search(class_regex)>=0) 
                newinfo=classinfo.replace(class_regex,"");
            else {
                if (attrib)
                    elt.setAttribute(attrib,classinfo+' '+classname);
                else elt.className=classinfo+' '+classname;
                return true;}
            if (newinfo)
                newinfo=newinfo.replace(whitespace_pat," ").replace(
                    trimspace_pat,"");
            if (attrib) {
                if (newinfo) {
                    elt.setAttribute(attrib,newinfo);
                    elt.className=elt.className;}
                else if (!(keep)) {
                    elt.removeAttribute(attrib);
                    elt.className=elt.className;}
                else {}}
            else elt.className=newinfo;
            return false;}
        fdjtDOM.toggleClass=toggleClass;
        fdjtDOM.tC=toggleClass;
        
        function toggleParent(node,spec,classname,attrib,keep){
            var parent=getParent(node,spec);
            if (parent) toggleClass(parent,classname,attrib,keep);}
        fdjtDOM.toggleParent=toggleParent;
        fdjtDOM.tP=toggleParent;

        var text_input_types=
            fdjtDOM.text_input_types=/text|url|email|search|tel|number|range|password/i;
        function isTextInput(target){
            return (((target.tagName==='INPUT')&&
                     (target.type.search(text_input_types)===0))||
                    (target.tagName==='TEXTAREA'));}
        fdjtDOM.isTextInput=isTextInput;
        
        function isImage(target){
            return (target.tagName==='IMG');}
        fdjtDOM.isImage=isImage;

        /* Simple CSS selectors */

        var selectors={};

        function Selector(spec,tagcs) {
            var i, lim;
            if (!(spec)) return this; // just cons with type
            else if (selectors[spec]) return selectors[spec]; // check cache
            else if (!(this instanceof Selector))
                // handle case of the forgotten 'new'
                return Selector.call(new Selector(),spec);
            if ((Array.isArray(spec))||
                ((typeof spec === "string")&&(spec.indexOf(',')>0))) {
                // create compound selectors
                var compound=[], specs=[];
                if (typeof spec === "string")
                    specs=spec.split(',');
                else {
                    var j=0, jlim=spec.length; while (j<jlim) {
                        if (typeof spec[j] !== "string") j++;
                        else if (spec[j].indexOf(',')>=0)
                            specs=specs.concat(spec[j++].split(','));
                        else specs.push(spec[j++]);}}
                i=0; lim=specs.length;
                while (i<lim) {
                    var sub=string_trim(specs[i++]);
                    var sel=new Selector(sub);
                    if (sel) compound.push(sel);}
                this.compound=compound;
                selectors[spec]=this;
                if (typeof spec === "string") this.spec=spec;
                else this.spec=specs.join(",");
                return this;}
            // Otherwise, parse and set up this
            var elts=spec.match(css_selector_regex);
            var classes=[]; var classnames=[]; var attribs=false;
            if (!(elts))
                fdjtLog.warn("Couldn't parse spec %s",spec);
            this.tag=false;
            if (elts) {
                i=0; lim=elts.length;
                if (!((elts[0][0]==='.')||(elts[0][0]==='#')||
                      (elts[0][0]==='['))) {
                    this.tag=((tagcs)?(elts[0]):(elts[0].toUpperCase()));
                    i=1;}
                while (i<lim)
                    if (elts[i][0]==='#') this.id=elts[i++].slice(1);
                else if (elts[i][0]==='.') {
                    classnames.push(elts[i].slice(1));
                    classes.push(classPat(elts[i++].slice(1)));}
                else if (elts[i][0]==='[') {
                    var aelts=elts[i++]; var eltsend=aelts.length-1;
                    if (!(attribs)) attribs={};
                    var eqpos=aelts.indexOf('=');
                    if (eqpos<0)
                        attribs[aelts.slice(1,eltsend)]=true;
                    else if (aelts[eqpos+1]==='~') 
                        attribs[aelts.slice(1,eqpos)]=
                        classPat(aelts.slice(eqpos+2,eltsend));
                    else attribs[aelts.slice(1,eqpos)]=
                        aelts.slice(eqpos+1,eltsend);}
                else fdjtLog.uhoh("weird elts %o",elts[i++]);}
            if (classes.length) {
                this.classes=classes; this.classnames=classnames;}
            else this.classes=false;
            if (attribs) this.attribs=attribs;
            else this.attribs=false;
            this.rank=[0,((this.id)?(1):(0)),
                       classnames.length+((attribs)?(attribs.length):(0)),
                       1];
            selectors[spec]=this;
            this.spec=spec;
            return this;}
        // Populate the prototype's fields
        Selector.prototype.tag=Selector.prototype.classes=
            Selector.prototype.attribs=Selector.prototype.id=false;
        Selector.prototype.match=function(elt){
            if (elt.matchesSelector)
                return elt.matchesSelector(this.spec);
            var i, lim;
            if (this.compound) {
                var compound=this.compound; i=0; lim=compound.length;
                while (i<lim) if (compound[i++].match(elt)) return true;
                return false;} 
            if ((this.tag)&&(this.tag!==elt.tagName)) return false;
            else if ((this.id)&&(this.id!==elt.id)) return false;
            if (this.classes)
                if (typeof elt.className === "string") {
                    var classname=elt.className; var classes=this.classes;
                    i=0; lim=classes.length;
                    while (i<lim)
                        if (classname.search(classes[i++])<0)
                            return false;}
            else return false;
            if (this.attribs) {
                var attribs=this.attribs;
                for (var name in attribs)
                    if (attribs.hasOwnProperty(name)) {
                        var val=elt.getAttribute(name);
                        if (!(val)) return false;
                        var need=this[name];
                        if (need===true) {}
                        else if (typeof need === 'string') {
                            if (need!==val) return false;}
                        else if (val.search(need)<0) return false;}}
            return true;};
        Selector.prototype.find=function(elt,results){
            var probe, i, lim;
            if (!(results)) results=[];
            if (this.compound) {
                var compound=this.compound;
                i=0; lim=compound.length;
                while (i<lim) compound[i++].find(elt,results);
                return results;}
            if (this.id) {
                probe=document.getElementById(this.id);
                if (!(probe)) return results;
                else if (this.match(probe)) {
                    results.push(probe); return results;}
                else return results;}
            var candidates=[];
            var classnames=this.classnames; var attribs=this.attribs;
            if (this.classes) 
                if (elt.getElementsByClassName)
                    candidates=elt.getElementsByClassName(classnames[0]);
            else gatherByClass(elt,this.classes[0],candidates);
            else if ((this.tag)&&(elt.getElementsByTagName))
                candidates=elt.getElementsByTagName(this.tag);
            else if (this.attribs) {
                attribs=this.attribs;
                for (var name in attribs)
                    if (attribs.hasOwnProperty(name)) {
                        gatherByAttrib(elt,name,attribs[name],candidates);
                        break;}}
            else if (this.tag) {
                gatherByTag(elt,this.tag,candidates);}
            else {}
            if (candidates.length===0) return candidates;
            if (((this.tag)&&(!(this.classes))&&(!(this.attribs)))||
                ((!(this.tag))&&(this.classes)&&(this.classes.length===1)&&
                 (!(this.attribs))))
                // When there's only one test, don't bother filtering
                if (results.length) return extendArray(results,candidates);
            else if (candidates instanceof Array)
                return candidates;
            else return toArray(candidates);
            i=0; lim=candidates.length;
            while (i<lim) {
                var candidate=candidates[i++];
                if (this.match(candidate)) results.push(candidate);}
            return results;};
        fdjtDOM.Selector=Selector;
        fdjtDOM.sel=function(spec){
            if (!(spec)) return false;
            else if (spec instanceof Selector) return spec;
            else if (spec instanceof Array) {
                if (spec.length)
                    return new Selector(spec.join(","));
                else return false;}
            else if (typeof spec === 'string')
                return new Selector(spec);
            else {
                fdjtLog.warn("Non selector spec: %o",spec);
                return false;}};

        function gatherByClass(node,pat,results){
            if (node.nodeType===1) {
                var classname=node.className;
                if ((typeof classname === "string")&&(classname.search(pat)>=0))
                    results.push(node);
                var children=node.childNodes;
                if (children) {
                    var i=0; var lim=children.length;
                    while (i<lim) gatherByClass(children[i++],pat,results);}}}
        function gatherByTag(node,tag,results){
            if (node.nodeType===1) {
                if ((typeof tag === "string")?
                    (node.tagName.toLowerString()===tag):
                    ((tag instanceof RegExp)&&(tag.match(node.tagName))))
                    results.push(node);
                var children=node.childNodes;
                if (children) {
                    var i=0; var lim=children.length;
                    while (i<lim) gatherByTag(children[i++],tag,results);}}}
        function gatherByAttrib(node,attrib,val,results){
            if (node.nodeType===1) {
                if ((node.getAttribute(attrib))&&
                    ((typeof val === 'string')?
                     (node.getAttribute(attrib)===val):
                     (node.getAttribute(attrib).search(val)>=0)))
                    results.push(node);
                var children=node.childNodes;
                if (children) {
                    var i=0; var lim=children.length;
                    while (i<lim) gatherByAttrib(children[i++],attrib,val,results);}}}
        
        function gather_children(node,pat,attrib,results){
            if (!(attrib)) gatherByClass(node,pat,results);
            else if (attrib==='class') gatherByClass(node,pat,results);
            else if (attrib==='tagName') gatherByTag(node,pat,results);
            else gatherByAttrib(node,attrib,pat,results);}

        /* Real simple DOM search */

        function getParent(elt,parent){
            if (typeof elt === 'string') {
                if (elt[0]==='#')
                    elt=document.getElementById(elt.slice(1));
                else elt=document.getElementById(elt);}
            if (!(elt)) return false;
            else if (!(parent)) return false;
            else if (parent.nodeType) {
                while (elt) {
                    if (elt===parent) return parent;
                    else elt=elt.parentNode;}
                return false;}
            else if (typeof parent === 'function') {
                while (elt) {
                    if (parent(elt)) return elt;
                    else elt=elt.parentNode;}
                return false;}
            else if (parent instanceof Selector) {
                while (elt) {
                    if (elt.nodeType!==1) elt=elt.parentNode;
                    else if (parent.match(elt)) return elt;
                    else elt=elt.parentNode;}
                return false;}
            else if (parent instanceof RegExp) {
                while (elt) {
                    if (elt.nodeType!==1) elt=elt.parentNode;
                    else if ((elt.className)&&(parent.test(elt.className)))
                        return elt;
                    else elt=elt.parentNode;}
                return false;}
            else if (typeof parent === 'string')
                return getParent(elt,new Selector(parent));
            else throw { error: 'invalid parent spec'};}
        fdjtDOM.getParent=getParent;
        fdjtDOM.hasParent=getParent;
        fdjtDOM.$P=getParent;
        fdjtDOM.inherits=function(node,spec) {
            var sel=new Selector(spec);
            return ((sel.match(node))?(node):(getParent(node,sel)));};

        fdjtDOM.getParents=function getParents(node,sel){
            var results=[], scan=node, parent=false;
            while ((parent=getParent(scan,sel))) {
                results.push(parent);
                scan=parent.parentNode;}
            return results;};

        function getChildNodes(node){
            if (node.nodeType!==1) return [];
            else if (!(node.childNodes)) return [];
            else return toArray(node.childNodes);}
        fdjtDOM.getChildNodes=getChildNodes;

        function getChildren(node,classname,attrib,results){
            if (typeof node === "string") node=fdjtID(node);
            if (!(node)) return [];
            if (!(results)) results=[]; 
            if (!(attrib)) {
                if (typeof classname === 'function')
                    filter_children(node,classname,results);
                else if (classname instanceof RegExp)
                    regexp_filter_children(node,classname,results);
                else if (classname instanceof Selector)
                    return classname.find(node,results);
                else if (typeof classname === 'string') {
                    if ((usenative) && (node.querySelectorAll))
                        return node.querySelectorAll(classname);
                    else return getChildren(
                        node,new Selector(classname),false,results);}
                else if (classname.length) {
                    var i=0, lim=classname.length;
                    while (i<lim)
                        getChildren(node,classname[i++],attrib,results);}
                else {}}
            else if (typeof attrib !== 'string')
                throw { error: 'bad selector arg', selector: classname};
            else gather_children(node,classname,attrib||false,results);
            return results;}
        fdjtDOM.getChildren=getChildren;
        fdjt.$=fdjtDOM.$=function(spec,root){
            return toArray(getChildren(root||document,spec));};
        function getFirstChild(elt,spec){
            var children=getChildren(elt,spec);
            if (children.length) return children[0]; else return false;}
        fdjt.$1=fdjtDOM.$1=fdjtDOM.getChild=fdjtDOM.getFirstChild=getFirstChild;

        function filter_children(node,filter,results){
            if (node.nodeType===1) {
                if (filter(node)) results.push(node);
                var children=node.childNodes;
                if (children) {
                    var i=0; var lim=children.length;
                    while (i<lim) filter_children(children[i++],filter,results);}}}

        function regexp_filter_children(node,rx,results){
            if (node.nodeType===1) {
                var classname=node.className;
                if ((typeof classname === "string")&&(classname.search(rx)>=0))
                    results.push(node);
                var children=node.childNodes;
                if (children) {
                    var i=0; var lim=children.length;
                    while (i<lim)
                        regexp_filter_children(children[i++],rx,results);}}}

        fdjtDOM.getAttrib=function(elt,attrib,ns){
            var probe;
            if ((ns)&&(elt.getAttributeByNS))
                probe=elt.getAttributeNS(attrib,ns);
            if (probe) return probe;
            else return elt.getAttribute(attrib)||
                elt.getAttribute("data-"+attrib);};

        fdjtDOM.findAttrib=function(scan,attrib,ns){
            var dattrib="data-"+attrib;
            while (scan) {
                if ((ns)&&(scan.getAttributeNS)&&
                    (scan.getAttributeNS(attrib,ns)))
                    return scan.getAttributeNS(attrib,ns);
                else if (scan.getAttribute) {
                    if (scan.getAttribute(attrib))
                        return scan.getAttribute(attrib);
                    else if (scan.getAttribute(dattrib))
                        return scan.getAttribute(dattrib);
                    else scan=scan.parentNode;}
                else scan=scan.parentNode;}
            return false;};
        
        /* First and last elements */
        function getFirstElement(node){
            if (node.firstElementChild) return node.firstElementChild;
            else if ((node.children)&&(node.children.length))
                return node.children[0];
            else return false;}
        fdjtDOM.getFirstElement=getFirstElement;
        function getLastElement(node){
            if (node.lastElementChild) return node.lastElementChild;
            else if ((node.children)&&(node.children.length))
                return node.children[node.children.length-1];
            else return false;}
        fdjtDOM.getLastElement=getLastElement;
        
        /* Manipulating the DOM */

        fdjtDOM.replace=function(existing,replacement,leaveids){
            var cur=existing;
            if (typeof existing === 'string')
                if (existing[0]==='#')
                    cur=document.getElementById(existing.slice(1));
            else cur=document.getElementById(existing);
            if (cur) {
                cur.parentNode.replaceChild(replacement,cur);
                if (!(leaveids)) {
                    if ((cur.id)&&(!(replacement.id)))
                        replacement.id=cur.id;}}
            else fdjtLog.uhoh("Can't find %o to replace it with %o",
                              existing,replacement);};
        function remove_node(node){
            if (node instanceof Array) {
                var i=0; var lim=node.length;
                while (i<lim) remove_node(node[i++]);
                return;}
            var cur=node;
            if (typeof node === 'string') {
                if (node[0]==='#') cur=document.getElementById(node.slice(1));
                else cur=document.getElementById(node);}
            if ((cur)&&(cur.parentNode))
                cur.parentNode.removeChild(cur);
            else if (cur)
                fdjtLog.uhoh("Looks like %o has already been removed (no parent)",cur);
            else fdjtLog.uhoh("Can't find %o to remove it",node);}
        fdjtDOM.remove=remove_node;
        
        function removeChildren(node){
            var children=node.childNodes, n=children.length-1;
            while (n>=0) node.removeChild(children[n--]);}
        fdjtDOM.removeChildren=removeChildren;

        function DOMappend(node) {
            if (typeof node === 'string') node=document.getElementById(node);
            domappend(node,aslice.call(arguments),1);}
        fdjtDOM.append=DOMappend;
        function DOMprepend(node) {
            if (typeof node === 'string') node=document.getElementById(node);
            if (node.firstChild)
                dominsert(node.firstChild,aslice.call(arguments),1);
            else domappend(node,aslice.call(arguments),1);}
        fdjtDOM.prepend=DOMprepend;
        
        function DOMinsertBefore(before) {
            if (typeof before === 'string')
                before=document.getElementById(before);
            dominsert(before,aslice.call(arguments),1);}
        fdjtDOM.insertBefore=DOMinsertBefore;
        function DOMinsertAfter(after) {
            if (typeof after === 'string')
                after=document.getElementById(after);
            if (after.nextSibling)
                dominsert(after.nextSibling,
                          aslice.call(arguments),1);
            else domappend(after.parentNode,
                           aslice.call(arguments),1);}
        fdjtDOM.insertAfter=DOMinsertAfter;
        
        /* DOM construction shortcuts */

        function tag_spec(spec,tag){
            if (!(spec)) return tag;
            else if (typeof spec === 'string') {
                var wordstart=spec.search(/\w/g);
                var puncstart=spec.search(/\W/g);
                if (puncstart<0) return tag+"."+spec;
                else if (wordstart!==0) return tag+spec;
                return spec;}
            else if (spec.tagName) return spec;
            else {
                spec.tagName=tag;
                return spec;}}

        fdjtDOM.Input=function(spec,name,value,title){
            if (spec.search(/\w/)!==0) spec='INPUT'+spec;
            var node=fdjtDOM(spec);
            node.name=name;
            if (value) node.value=value;
            if (title) node.title=title;
            return node;};
        fdjtDOM.Checkbox=function(name,value,checked){
            var node=fdjtDOM("INPUT");
            node.type="checkbox";
            node.name=name;
            if (value) node.value=value;
            if (checked) node.checked=true;
            else node.checked=false;
            return node;};
        fdjtDOM.Anchor=function(href,spec){
            spec=tag_spec(spec,"A");
            var node=fdjtDOM(spec); node.href=href;
            domappend(node,aslice.call(arguments),2);
            return node;};
        fdjtDOM.Image=function(src,spec,alt,title){
            spec=tag_spec(spec,"IMG");
            var node=fdjtDOM(spec); node.src=src;
            if (alt) node.alt=alt;
            if (title) node.title=title;
            domappend(node,aslice.call(arguments),4);
            return node;};

        function getInputs(root,name,type){
            var results=[];
            if (typeof root === 'string') {
                var root_elt=document.getElementById(root);
                if (!(root_elt)) fdjtLog.warn("Couldn't resolve %s to an object",root);
                root=root_elt;}
            if (!(root)) return results;
            var inputs=root.getElementsByTagName('input');
            var i=0; var lim=inputs.length;
            while (i<lim) {
                if (((!(name))||(inputs[i].name===name))&&
                    ((!(type))||(inputs[i].type===type)))
                    results.push(inputs[i++]); 
                else i++;}
            if ((!type)||(type==='textarea')||(type==='text')) {
                inputs=root.getElementsByTagName('textarea');
                i=0; lim=inputs.length;
                while (i<lim) {
                    if (((!(name))||(inputs[i].name===name))&&
                        ((!(type))||(inputs[i].type===type)))
                        results.push(inputs[i++]); 
                    else i++;}}
            if ((!type)||(type==='button')||(type==='submit')) {
                inputs=root.getElementsByTagName('button');
                i=0; lim=inputs.length;
                while (i<lim) {
                    if (((!(name))||(inputs[i].name===name))&&
                        ((!(type))||(inputs[i].type===type)))
                        results.push(inputs[i++]); 
                    else i++;}}
            if ((!type)||(type==='select')) {
                inputs=root.getElementsByTagName('select');
                i=0; lim=inputs.length;
                while (i<lim) {
                    if ((!(name))||(inputs[i].name===name))
                        results.push(inputs[i++]); 
                    else i++;}}
            return results;}

        fdjtDOM.getInputs=getInputs;
        fdjtDOM.getInput=function(root,name,type){
            var results=getInputs(root,name||false,type||false);
            if ((results)&&(results.length===1))
                return results[0];
            else if ((results)&&(results.length)) {
                fdjtLog.warn(
                    "Ambiguous input reference name=%o type=%o under %o",
                    name,type,root);
                return results[0];}
            else return false;};
        
        function getInputValues(root,name){
            var results=[];
            var inputs=root.getElementsByTagName('input');
            var i=0; var lim=inputs.length;
            while (i<lim) {
                var input=inputs[i++];
                if (input.name!==name) continue;
                if ((input.type==='checkbox')||(input.type==='radio')) {
                    if (!(input.checked)) continue;}
                results.push(input.value);}
            return results;}
        fdjtDOM.getInputValues=getInputValues;
        function getInputValue(root,name,n){
            var r=0;
            var inputs=root.getElementsByTagName('input');
            var i=0; var lim=inputs.length;
            while (i<lim) {
                var input=inputs[i++];
                if (input.disabled) continue;
                else if (input.name!==name) continue;
                else if ((input.type==='checkbox')||(input.type==='radio')) {
                    if (!(input.checked)) continue;}
                if (!(n)) return input.value;
                else if (r===n) return input.value;
                else r++;}
            return false;}
        fdjtDOM.getInputValue=getInputValue;

        function getInputsFor(root,name,value){
            if (typeof root === 'string')
                root=document.getElementById(root);
            if (!(root)) return [];
            var results=[];
            var inputs=root.getElementsByTagName('input');
            var i=0; var lim=inputs.length;
            while (i<lim) {
                var input=inputs[i++];
                if (input.name!==name) continue;
                else if (input.value!==value) continue;
                else results.push(input);}
            return results;}
        fdjtDOM.getInputsFor=getInputsFor;
        fdjtDOM.getInputFor=function(root,name,value){
            var results=getInputsFor(root,name||false,value||false);
            if ((results)&&(results.length===1))
                return results[0];
            else if ((results)&&(results.length)) {
                fdjtLog.warn(
                    "Ambiguous input reference name=%o name=%o under %o",
                    name,name,root);
                return results[0];}
            else return false;};


        function setInputs(selector,value){
            if (!(value)) return;
            var inputs=fdjtDOM.$(selector);
            var i=0, lim=inputs.length; while (i<lim) {
                inputs[i++].value=value;}}
        fdjtDOM.setInputs=setInputs;

        /* Getting style information generally */

        function getStyle(elt,prop){
            if (typeof elt === 'string') elt=document.getElementById(elt);
            if (!(elt)) return elt;
            if (elt.nodeType!==1) throw "Not an element";
            var style=
                ((window.getComputedStyle)&&
                 (window.getComputedStyle(elt,null)))||
                (elt.currentStyle);
            if (!(style)) return false;
            else if (prop) return style[prop];
            else return style;}
        fdjtDOM.getStyle=getStyle;

        function styleString(elt){
            var style=elt.style; var result;
            if (!(style)) return false;
            var i=0; var lim=style.length;
            if (lim===0) return false;
            while (i<lim) {
                var p=style[i];
                var v=style[p];
                if (i===0) result=p+": "+v;
                else result=result+"; "+p+": "+v;
                i++;}
            return result;}
        fdjtDOM.styleString=styleString;

        /* Getting display style */

        var display_styles={
            "DIV": "block","P": "block","BLOCKQUOTE":"block",
            "H1": "block","H2": "block","H3": "block","H4": "block",
            "H5": "block","H6": "block","H7": "block","H8": "block",
            "UL": "block","LI": "list-item",
            "DL": "block","DT": "list-item","DD": "list-item",
            "SPAN": "inline","EM": "inline","STRONG": "inline",
            "TT": "inline","DEFN": "inline","A": "inline",
            "TD": "table-cell","TR": "table-row",
            "TABLE": "table", "PRE": "preformatted"};

        function getDisplayStyle(elt){
            if ((!(elt))||(!(elt.nodeType))||(elt.nodeType!==1))
                return false;
            return (((window.getComputedStyle)&&
                     (window.getComputedStyle(elt,null))&&
                     (window.getComputedStyle(elt,null).display))||
                    (display_styles[elt.tagName])||
                    "inline");}
        fdjtDOM.getDisplay=getDisplayStyle;

        /* Generating text from the DOM */

        function flatten(string){return string.replace(/\s+/," ");}

        function textify(arg,flat,depth,domarkup){
            if (typeof depth !== 'number') depth=0;
            if (arg.nodeType) {
                if (arg.nodeType===3) {
                    if (flat) return flatten(arg.nodeValue);
                    else return arg.nodeValue;}
                else if (arg.nodeType===1) {
                    var children=arg.childNodes;
                    var style=getStyle(arg);
                    var display_type=style.display;
                    var position_type=style.position;
                    var whitespace=style.whiteSpace;
                    var classname=arg.className;
                    var string=""; var suffix="";
                    if (whitespace!=="normal") flat=false;
                    if (display_type==='none') return "";
                    else if (!((position_type==="static")||
                               (position_type==="")))
                        return "";
                    else if ((typeof classname === "string")&&
                             ((classname==='fdjtskiptext')||
                              (classname.search(/\bfdjtskiptext\b/)>=0)))
                        return "";
                    else if ((!(children))||(children.length===0)) {
                        if (!(domarkup)) return "";
                        else if (arg.alt) return "["+arg.alt+"]";
                        else return "[?]";}
                    // Figure out what suffix and prefix to use for this element
                    else if (!(display_type)) {}
                    else if (display_type==="inline") {}
                    else if (flat) suffix=" ";
                    else if ((display_type==="block") ||
                             (display_type==="table") ||
                             (display_type==="preformatted")) {
                        string="\n"; suffix="\n";}
                    else if (display_type==="table-row") suffix="\n";
                    else if (display_type==="table-cell") string="\t";
                    else {}
                    var i=0; while (i<children.length) {
                        var child=children[i++];
                        if (!(child.nodeType)) continue;
                        if (child.nodeType===3) {
                            if (flat) string=string+flatten(child.nodeValue);
                            else string=string+child.nodeValue;}
                        else if (child.nodeType===1) {
                            var stringval=textify(child,flat,true,domarkup);
                            if (stringval) string=string+stringval;}
                        else continue;}
                    return string+suffix;}
                else {}}
            else if (arg.toString)
                return arg.toString();
            else return arg.toString();}
        fdjtDOM.textify=textify;

        /* Geometry functions */

        function Geometry(elt,root){
            if (!(elt)) return this;
            else if (typeof elt === 'string')
                elt=document.getElementById(elt);
            if (!(elt)) return;
            var top = elt.offsetTop;
            var left = elt.offsetLeft;
            var width=elt.offsetWidth;
            var height=elt.offsetHeight;
            var rootp=((root)&&(root.offsetParent));
            this.elt=elt; this.root=root;
            if (elt===root) {
                left=0; top=0; bottom=height; right=width;}
            else {
                elt=elt.offsetParent;
                while (elt) {
                    if ((root)&&((elt===root)||(elt===rootp))) break;
                    top += elt.offsetTop;
                    left += elt.offsetLeft;
                    elt=elt.offsetParent;}}
            var bottom=top+height, right=left+width;
            this.left=left; this.top=top;
            this.width=width; this.height=height;
            this.right=right; this.bottom=bottom;
            return this;}
        Geometry.prototype.width=Geometry.prototype.height=
            Geometry.prototype.left=Geometry.prototype.right=
            Geometry.prototype.top=Geometry.prototype.bottom=0;

        function XGeometry(elt,root,withstack){
            if (withstack) withstack=[]; else withstack=false;
            if (!(elt)) return this;
            else if (typeof elt === 'string')
                elt=document.getElementById(elt);
            var top = elt.offsetTop;
            var left = elt.offsetLeft;
            var width=elt.offsetWidth;
            var height=elt.offsetHeight;
            var rootp=((root)&&(root.offsetParent));
            var style=getStyle(elt);
            this.elt=elt; this.root=root;
            if (elt===root) {
                left=0; top=0; bottom=height; right=width;}
            else {
                elt=elt.offsetParent;
                while (elt) {
                    if ((root)&&((elt===root)||(elt===rootp))) break;
                    if (withstack) withstack.push(elt);
                    top += elt.offsetTop;
                    left += elt.offsetLeft;
                    elt=elt.offsetParent;}}
            var bottom=top+height, right=left+width;
            this.left=left; this.top=top;
            this.width=width; this.height=height;
            this.right=right; this.bottom=bottom;
            if (style) {
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
                this.top_margin=t_margin;
                this.bottom_margin=b_margin;
                this.left_margin=l_margin;
                this.right_margin=r_margin;
                this.top_border=t_border;
                this.bottom_border=b_border;
                this.left_border=l_border;
                this.right_border=r_border;
                this.top_padding=t_padding;
                this.bottom_padding=b_padding;
                this.left_padding=l_padding;
                this.right_padding=r_padding;
                this.outer_height=outer_height;
                this.outer_width=outer_width;
                this.inner_height=inner_height;
                this.inner_width=inner_width;
                this.line_height=lhpx;}
            if (withstack) this.stack=withstack;
            return this;}
        XGeometry.prototype=new Geometry();
        XGeometry.top_margin=XGeometry.bottom_margin=
            XGeometry.left_margin=XGeometry.right_margin=
            XGeometry.top_border=XGeometry.bottom_border=
            XGeometry.left_border=XGeometry.right_border=
            XGeometry.top_padding=XGeometry.bottom_padding=
            XGeometry.left_padding=XGeometry.right_padding=
            XGeometry.outer_height=XGeometry.outer_width=
            XGeometry.inner_height=XGeometry.inner_width=
            XGeometry.line_height=0;

        function getGeometry(elt,root,extra){
            if (extra) 
                return new XGeometry(elt,root);
            else return new Geometry(elt,root);}
        fdjtDOM.getGeometry=getGeometry;
        fdjtDOM.XGeometry=XGeometry;
        fdjtDOM.Geometry=Geometry;
        
        function geomString(geom){
            return +((typeof geom.width === 'number')?(geom.width):"?")+
                "x"+((typeof geom.height === 'number')?(geom.height):"?")+
                "@l:"+((typeof geom.left === 'number')?(geom.left):"?")+
                ",t:"+((typeof geom.top === 'number')?(geom.top):"?")+
                "/r:"+((typeof geom.right === 'number')?(geom.right):"?")+
                ",b:"+((typeof geom.bottom === 'number')?(geom.bottom):"?");}
        fdjtDOM.geomString=geomString;

        function isVisible(elt,partial){
            if (!(partial)) partial=false;
            if ((elt.offsetParent)&&(elt.offsetParent!==document.body)) {
                var container=elt.offsetParent;
                var offtop=elt.offsetTop, offbot=offtop+elt.offsetHeight;
                var offleft=elt.offsetLeft;
                var offright=offleft+elt.offsetWidth;
                var l=container.scrollLeft, r=l+container.clientWidth;
                var t=container.scrollTop, b=t+container.clientHeight;
                if (partial)
                    return ((((offleft>=l)&&(offleft<=r))||
                             ((offright>=l)&&(offright<=r))||
                             ((offleft<l)&&(offright>r)))&&
                            (((offtop>=t)&&(offtop<=b))||
                             ((offbot>=t)&&(offbot<=b))||
                             ((offtop<=t)&&(offbot>=b))));
                else return ((((offleft>=l)&&(offleft<=r))&&
                              ((offright>=l)&&(offright<=r)))&&
                             (((offtop>=t)&&(offtop<=b))&&
                              ((offbot>=t)&&(offbot<=b))));}
            var top = elt.offsetTop;
            var left = elt.offsetLeft;
            var width = elt.offsetWidth;
            var height = elt.offsetHeight;
            var winx=(window.pageXOffset||document.documentElement.scrollLeft||0);
            var winy=(window.pageYOffset||document.documentElement.scrollTop||0);
            var winxedge=winx+(document.documentElement.clientWidth);
            var winyedge=winy+(document.documentElement.clientHeight);
            
            while(elt.offsetParent) {
                if (elt===window) break;
                elt = elt.offsetParent;
                top += elt.offsetTop;
                left += elt.offsetLeft;}

            if ((elt)&&(!((elt===window)||(elt===document.body)))) {
                // fdjtLog("%o l=%o t=%o",elt,elt.scrollLeft,elt.scrollTop);
                if ((elt.scrollTop)||(elt.scrollLeft)) {
                    fdjtLog("Adjusting for inner DIV");
                    winx=elt.scrollLeft; winy=elt.scrollTop;
                    winxedge=winx+elt.scrollWidth;
                    winyedge=winy+elt.scrollHeight;}}

            /*
              fdjtLog("fdjtIsVisible%s %o top=%o left=%o height=%o width=%o",
              ((partial)?("(partial)"):""),start,
              top,left,height,width);
              fdjtLog("fdjtIsVisible %o winx=%o winy=%o winxedge=%o winyedge=%o",
              elt,winx,winy,winxedge,winyedge);
            */
            
            if (partial)
                // There are three cases we check for:
                return (
                    // top of element in window
                    ((top > winy) && (top < winyedge) &&
                     (left > winx) && (left < winxedge)) ||
                        // bottom of element in window
                        ((top+height > winy) && (top+height < winyedge) &&
                         (left+width > winx) && (left+width < winxedge)) ||
                        // top above/left of window, bottom below/right of window
                        (((top < winy) || (left < winx)) &&
                         ((top+height > winyedge) && (left+width > winxedge))));
            else return ((top > winy) && (left > winx) &&
                         (top + height) <= (winyedge) &&
                         (left + width) <= (winxedge));}
        fdjtDOM.isVisible=isVisible;

        function isAtTop(elt,delta){
            if (!(delta)) delta=50;
            var top = elt.offsetTop;
            var left = elt.offsetLeft;
            var winy=(window.pageYOffset||document.documentElement.scrollTop||0);
            var winyedge=winy+(document.documentElement.clientHeight);
            
            while(elt.offsetParent) {
                elt = elt.offsetParent;
                top += elt.offsetTop;
                left += elt.offsetLeft;}

            return ((top>winy) && (top<winyedge) && (top<winy+delta));}
        fdjtDOM.isAtTop=isAtTop;

        function textwidth(node){
            if (node.nodeType===3) return node.nodeValue.length;
            else if (node.nodeType!==1) return 0;
            else {
                var style=getStyle(node);
                var display=style.display, position=style.position;
                if (display==="none") return 0;
                else if (!((position==="")||(position==="static")))
                    return 0;
                else if (typeof node.className!=="string") return 0;
                else if ((node.className==="fdjtskiptext")||
                         ((typeof node.className === "string")&&
                          (node.className.search(/\bfdjtskiptext/)>=0)))
                    return 0;
                else if (node.getAttribute('data-locwidth')) {
                    return parseInt(node.getAttribute('data-locwidth'));}
                else if (node.childNodes) {
                    var children=node.childNodes;
                    var padding=((display==='inline')?(0):
                                 (/^(li|td|dt|dd|label|input)$/i.exec(node.tagName))?(1):(2));
                    var i=0; var lim=children.length; var width=0;
                    while (i<lim) {
                        var child=children[i++];
                        if (child.nodeType===3)
                            width=width+child.nodeValue.length;
                        else if (child.nodeType===1)
                            width=width+textwidth(child);
                        else {}}
                    return width+padding*2;}
                else if (node.alt) return node.alt.length+2;
                else return 3;}}
        fdjtDOM.textWidth=textwidth;

        function countBreaks(arg){
            if (typeof arg === 'string') {
                return arg.match(/\W*\s+\W*/g).length;}
            else if (!(arg.nodeType)) return 0;
            else if (arg.nodeType===1) {}
            else if (arg.nodeType===3)
                return arg.nodeValue.match(/\W*\s+\W*/g).length;
            else return 0;}
        fdjtDOM.countBreaks=countBreaks;
        
        var nontext_content=/(img|object|svg|hr)/i;

        function hasContent(node,recur,test,limit){
            if (node===limit) return false;
            else if (node.nodeType===3)
                return (node.nodeValue.search(/\w/g)>=0);
            else if (node.nodeType!==1) return false;
            else if ((test)&&(test.match)&&(test.match(node)))
                return true;
            else if (node.tagName.search(nontext_content)===0)
                return true;
            else if ((typeof node.className === "string")&&
                     (node.className.search(/\bfdjtskiptext\b/g)>=0))
                return false;
            else if ((node.childNodes)&&(node.childNodes.length)) {
                var children=node.childNodes;
                var i=0; while (i<children.length) {
                    var child=children[i++];
                    if (child===limit) return false;
                    else if (child.nodeType===3) {
                        if (child.nodeValue.search(/\w/g)>=0) return true;
                        else continue;}
                    else if (child.nodeType!==1) continue;
                    else if (recur) {
                        if (hasContent(child,recur,test,limit)) return true;
                        else continue;}
                    else continue;}
                return false;}
            else return false;}
        fdjtDOM.hasContent=hasContent;

        function hasText(node){
            if (node.childNodes) {
                var children=node.childNodes;
                var i=0; while (i<children.length) {
                    var child=children[i++];
                    if (child.nodeType===3)
                        if (child.nodeValue.search(/\w/g)>=0) return true;
                    else {}}
                return false;}
            else return false;}
        fdjtDOM.hasText=hasText;

        /* A 'refresh method' does a className eigenop to force IE redisplay */

        fdjtDOM.refresh=function(elt){
            elt.className=elt.className;};
        fdjtDOM.setAttrib=function(elt,attrib,val){
            if ((typeof elt === 'string')&&(fdjtID(elt)))
                elt=fdjtID(elt);
            elt.setAttribute(attrib,val);
            elt.className=elt.className;};
        fdjtDOM.dropAttrib=function(elt,attrib){
            if ((typeof elt === 'string')&&(fdjtID(elt)))
                elt=fdjtID(elt);
            elt.removeAttribute(attrib);
            elt.className=elt.className;};

        /* Determining if something has overflowed */
        fdjtDOM.overflowing=function(node){
            return (node.scrollHeight>node.clientHeight);};
        fdjtDOM.voverflow=function(node){
            return (node.scrollHeight/node.clientHeight);};
        fdjtDOM.hoverflow=function(node){
            return (node.scrollWidth/node.clientWidth);};

        /* Listeners */

        function addListener(node,evtype,handler){
            if (!(node)) node=document;
            if (typeof node === 'string') {
                var elt=fdjtID(node);
                if (!(node)) {
                    fdjtLog.warn("Can't find #%s",node);
                    return;}
                node=elt;}
            else if (((Array.isArray)&&(Array.isArray(node)))||
                     ((window.NodeList)&&(node instanceof window.NodeList))) {
                var i=0; var lim=node.length;
                while (i<lim) addListener(node[i++],evtype,handler);
                return;}
            else if ((node!==window)&&(!(node.nodeType))) {
                fdjtLog.warn("Bad target(s) arg to addListener(%s) %o",evtype,node);
                return;}
            // OK, actually do it
            if (evtype==='title') { 
                // Not really a listener, but helpful
                if (typeof handler === 'string') 
                    if (node.title)
                        node.title='('+handler+') '+node.title;
                else node.title=handler;}
            else if (evtype[0]==='=')
                node[evtype.slice(1)]=handler;
            else if (node.addEventListener)  {
                // fdjtLog("Adding listener %o for %o to %o",handler,evtype,node);
                return node.addEventListener(evtype,handler,false);}
            else if (node.attachEvent)
                return node.attachEvent('on'+evtype,handler);
            else fdjtLog.warn('This node never listens: %o',node);}
        fdjtDOM.addListener=addListener;

        function defListeners(handlers,defs){
            if ((handlers)&&(defs))
                for (var domspec in defs) {
                    if (defs.hasOwnProperty(domspec)) {
                        var evtable=defs[domspec];
                        var addto=handlers[domspec];
                        if ((!(addto))||
                            (!(handlers.hasOwnProperty(domspec))))
                            handlers[domspec]=addto={};
                        for (var evtype in evtable) {
                            if (evtable.hasOwnProperty(evtype))
                                addto[evtype]=evtable[evtype];}}}}
        fdjtDOM.defListeners=defListeners;

        var events_pat=/^([^:]+)$/;
        var spec_events_pat=/^([^: ]+):([^: ]+)$/;

        function addListeners(node,handlers){
            if (handlers) {
                for (var evtype in handlers) {
                    if (handlers.hasOwnProperty(evtype)) {
                        var match=false, val=handlers[evtype];
                        if (!(val.call)) {}
                        else if (events_pat.exec(evtype))
                            addListener(node,evtype,handlers[evtype]);
                        else if ((match=spec_events_pat.exec(evtype))) {
                            var ev=match[2];
                            var handler=handlers[evtype];
                            var elts=node.querySelectorAll(match[1]);
                            addListener(elts,ev,handler);}}}}}
        fdjtDOM.addListeners=addListeners;
        
        function removeListener(node,evtype,handler){
            if (!(node)) node=document;
            if (typeof node === 'string') {
                var elt=fdjtID(node);
                if (!(node)) {
                    fdjtLog("Can't find #%s",node);
                    return;}
                node=elt;}
            else if (((Array.isArray)&&(Array.isArray(node)))||
                     ((window.NodeList)&&(node instanceof window.NodeList))) {
                var i=0; var lim=node.length;
                while (i<lim) removeListener(node[i++],evtype,handler);
                return;}
            else if ((node!==window)&&(!(node.nodeType))) {
                fdjtLog.warn("Bad target(s) arg to removeListener(%s) %o",evtype,node);
                return;}
            // OK, actually do it
            if (node.removeEventListener)  {
                return node.removeEventListener(evtype,handler,false);}
            else if (node.detachEvent)
                return node.detachEvent('on'+evtype,handler);
            else fdjtLog.warn('This node never listens: %o',node);}
        fdjtDOM.removeListener=removeListener;

        function eventTarget(evt) {
            evt=evt||window.event; 
            return (evt.target)||(evt.srcElement);}
        fdjtDOM.T=eventTarget;
        fdjtDOM.eventTarget=eventTarget;
        fdjtDOM.getTarget=eventTarget;

        function cancelEvent(evt){
            evt=evt||window.event;
            if (evt.preventDefault) evt.preventDefault();
            else evt.returnValue=false;
            evt.cancelBubble=true;}
        fdjtDOM.cancel=cancelEvent;

        function triggerClick(elt){
            if (document.createEvent) { // in chrome
                var e = document.createEvent('MouseEvents');
                e.initEvent( 'click', true, true );
                elt.dispatchEvent(e);
                return;}
            else {
                fdjtLog.warn("Couldn't trigger click");
                return;}}
        fdjtDOM.triggerClick=triggerClick;

        /* Scrolling by pages */
        function pageScroll(container,n){
            var ch=container.clientHeight, delta=ch*n;
            var sh=container.scrollHeight, st=container.scrollTop;
            var nt=st+delta;
            if (ch>=sh) return;
            if (nt<0) container.scrollTop=0;
            else if ((nt+ch)>=sh) container.scrollTop=sh-ch;
            else container.scrollTop=nt;}
        fdjtDOM.pageScroll=pageScroll;

        /* Sizing to fit */

        var default_trace_adjust=false;

        function getInsideBounds(container){
            var left=false; var top=false;
            var right=false; var bottom=false;
            var children=container.childNodes;
            var i=0; var lim=children.length;
            while (i<lim) {
                var child=children[i++];
                if (typeof child.offsetLeft !== 'number') continue;
                var style=getStyle(child);
                if (style.position!=='static') continue;
                var child_left=child.offsetLeft-parsePX(style.marginLeft);
                var child_top=child.offsetTop-parsePX(style.marginTop);
                var child_right=child.offsetLeft+child.offsetWidth+parsePX(style.marginRight);
                var child_bottom=child.offsetTop+child.offsetHeight+parsePX(style.marginBottom);
                if (left===false) {
                    left=child_left; right=child_right;
                    top=child_top; bottom=child_bottom;}
                else {
                    if (child_left<left) left=child_left;
                    if (child_top<top) top=child_top;
                    if (child_right>right) right=child_right;
                    if (child_bottom>bottom) bottom=child_bottom;}}
            return {left: left,right: right,top: top, bottom: bottom,
                    width: right-left,height:bottom-top};}
        fdjtDOM.getInsideBounds=getInsideBounds;
        function applyScale(container,scale){
            var images=fdjtDOM.getChildren(container,"IMG");
            var ilim=images.length;
            if (scale) {
                container.scale=scale;
                container.style.fontSize=scale+'%';
                var rounded=10*Math.round(scale/10);
                fdjtDOM.addClass(container,"fdjtscaled");
                fdjtDOM.swapClass(
                    container,/\bfdjtscale\d+\b/,"fdjtscale"+rounded);}
            else if (!(container.scale)) return;
            else {
                delete container.scale;
                container.style.fontSize="";
                fdjtDOM.dropClass(container,"fdjtscaled");
                fdjtDOM.dropClass(container,/\bfdjtscale\d+\b/);}
            var iscan=0; while (iscan<ilim) {
                var image=images[iscan++];
                if ((fdjtDOM.hasClass(image,"nofdjtscale"))||
                    (fdjtDOM.hasClass(image,"noautoscale")))
                    continue;
                // Reset dimensions to get real info
                image.style.maxWidth=image.style.width=
                    image.style.maxHeight=image.style.height='';
                if (scale) {
                    var width=image.offsetWidth;
                    var height=image.offsetHeight;
                    image.style.maxWidth=image.style.width=
                        Math.round(width*(scale/100))+'px';
                    image.style.maxHeight=image.style.height=
                        Math.round(height*(scale/100))+'px';}}}
        
        function adjustInside(elt,container,step,min,pad){
            var trace_adjust=(elt.traceadjust)||
                (container.traceadjust)||fdjtDOM.trace_adjust||
                ((typeof elt.className === "string")&&
                 (elt.className.search(/\btraceadjust\b/)>=0))||
                ((typeof container.className === "string")&&
                 (container.className.search(/\btraceadjust\b/)>=0))||
                default_trace_adjust;
            if (!(step)) step=5;
            if (!(min)) min=50;
            if (!(pad)) pad=1;
            var scale=100;
            function adjust(){
                var outside=getGeometry(container);
                var inside=getGeometry(elt,container);
                var style=getStyle(container);
                var maxwidth=
                    outside.width-
                    (parsePX(style.paddingLeft,0)+
                     parsePX(style.borderLeft,0)+
                     parsePX(style.paddingRight,0)+
                     parsePX(style.borderRight,0));
                var maxheight=
                    outside.height-
                    (parsePX(style.paddingTop,0)+
                     parsePX(style.borderTop,0)+
                     parsePX(style.paddingBottom,0)+
                     parsePX(style.borderBottom,0));
                if (trace_adjust)
                    fdjtLog("adjustInside scale=%o step=%o min=%o pad=%o [l%o,t%o,r%o,b%o] << %ox%o < %ox%o",
                            scale,step,min,pad,
                            inside.left,inside.top,inside.right,inside.bottom,
                            maxwidth*pad,maxheight*pad,
                            maxwidth,maxheight);
                if ((inside.top>=0)&&(inside.bottom<=(pad*maxheight))&&
                    (inside.left>=0)&&(inside.right<=(pad*maxwidth)))
                    return;
                else if (scale<=min) return;
                else {
                    scale=scale-step;
                    applyScale(elt,scale,trace_adjust);
                    setTimeout(adjust,10);}}
            setTimeout(adjust,10);}
        function adjustToFit(container,threshold,padding){
            var trace_adjust=(container.traceadjust)||
                fdjtDOM.trace_adjust||
                ((typeof container.className === "string")&&
                 (container.className.search(/\btraceadjust\b/)>=0))||
                default_trace_adjust;
            var style=getStyle(container);
            var geom=getGeometry(container);
            var maxheight=((style.maxHeight)&&(parsePX(style.maxHeight)))||
                (geom.height);
            var maxwidth=((style.maxWidth)&&(parsePX(style.maxWidth)))||
                (geom.width);
            var goodenough=threshold||0.1;
            var scale=(container.scale)||100.0;
            var bounds=getInsideBounds(container);
            var hpadding=
                (fdjtDOM.parsePX(style.paddingLeft)||0)+
                (fdjtDOM.parsePX(style.paddingRight)||0)+
                (fdjtDOM.parsePX(style.borderLeftWidth)||0)+
                (fdjtDOM.parsePX(style.borderRightWidth)||0)+
                padding;
            var vpadding=
                (fdjtDOM.parsePX(style.paddingTop)||0)+
                (fdjtDOM.parsePX(style.paddingBottom)||0)+
                (fdjtDOM.parsePX(style.borderTopWidth)||0)+
                (fdjtDOM.parsePX(style.borderBottomWidth)||0)+
                padding;
            maxwidth=maxwidth-hpadding; maxheight=maxheight-vpadding; 
            var itfits=
                ((bounds.height/maxheight)<=1)&&((bounds.width/maxwidth)<=1);
            if (trace_adjust) 
                fdjtLog("Adjust (%o) %s cur=%o%s, best=%o~%o, limit=%ox%o=%o, box=%ox%o=%o, style=%s",
                        goodenough,fdjtDOM.nodeString(container),
                        scale,((itfits)?" (fits)":""),
                        container.bestscale||-1,container.bestfit||-1,
                        maxwidth,maxheight,maxwidth*maxheight,
                        bounds.width,bounds.height,bounds.width*bounds.height,
                        styleString(container));
            if (itfits) {
                /* Figure out how well it fits */
                var fit=Math.max((1-(bounds.width/maxwidth)),
                                 (1-(bounds.height/maxheight)));
                var bestfit=container.bestfit||1.5;
                if (!(trace_adjust)) {}
                else if (container.bestscale) 
                    fdjtLog("%s %o~%o vs. %o~%o",
                            ((fit<goodenough)?"Good enough!":
                             ((fit<bestfit)?"Better!":"Worse!")),
                            scale,fit,container.bestscale,container.bestfit);
                else fdjtLog("First fit %o~%o",scale,fit);
                if (fit<bestfit) {
                    container.bestscale=scale; container.bestfit=fit;}
                // If it's good enough, just return
                if (fit<goodenough) {
                    container.goodscale=scale; return;}}
            // Figure out the next scale factor to try
            var rh=maxheight/bounds.height; var rw=maxwidth/bounds.width;
            var newscale=
                ((itfits)?
                 (scale*Math.sqrt
                  ((maxwidth*maxheight)/(bounds.width*bounds.height))):
                 (rh<rw)?(scale*rh):(scale*rw));
            if (trace_adjust)
                fdjtLog("[%fs] Trying newscale=%o, rw=%o rh=%o",
                        fdjt.ET(),newscale,rw,rh);
            applyScale(container,newscale,trace_adjust);}
        fdjtDOM.applyScale=applyScale;
        fdjtDOM.adjustToFit=adjustToFit;
        fdjtDOM.adjustInside=adjustInside;
        fdjtDOM.insideBounds=getInsideBounds;
        fdjtDOM.finishScale=function(container){
            var traced=(container.traceadjust)||
                fdjtDOM.trace_adjust||default_trace_adjust;
            if (!(container.bestscale)) {
                applyScale(container,false,traced);
                fdjtLog("No good scaling for %o style=%s",
                        fdjtDOM.nodeString(container),
                        fdjtDOM.styleString(container));
                return;}
            else if (container.scale===container.bestscale) {}
            else applyScale(container,container.bestscale,traced);
            if (traced)
                fdjtLog("Final scale %o~%o for %o style=%s",
                        container.bestscale,container.bestfit,
                        fdjtDOM.nodeString(container),
                        fdjtDOM.styleString(container));
            delete container.bestscale;
            delete container.bestfit;
            delete container.goodscale;};
        
        /* Scaling to fit using CSS transforms */

        function scale_node(node,fudge,origin,shrink){
            if (!(origin)) origin=node.getAttribute("data-origin");
            if (!(shrink)) shrink=node.getAttribute("data-shrink");
            if (!(fudge)) fudge=node.getAttribute("data-fudge");

            // Clear any existing adjustments
            var first=node.firstChild, wrapper=
                ((first.className==="fdjtadjusted")?(first):
                 (getFirstChild(node,"fdjtadjusted")));
            if (wrapper) wrapper.setAttribute("style","");

            var geom=getGeometry(node,false,true), inside=getInsideBounds(node);
            var avail_width=((fudge)?(fudge*geom.inner_width):
                             (geom.inner_width));
            var avail_height=((fudge)?(fudge*geom.inner_height):
                              (geom.inner_height));

            if ((inside.height<=avail_height)&&(inside.width<=avail_width)) {
                // Everything is inside
                if (!(shrink)) return;
                // If you fit closely in any dimension, don't try scaling
                if (((inside.height<avail_height)&&
                     (inside.height>=(avail_height*0.9)))||
                    ((inside.width<geom.inner_width)&&
                     (inside.width>=(avail_height*0.9))))
                    return;}
            if (!(wrapper)) {
                var nodes=[], children=node.childNodes;
                var i=0, lim=children.length;
                while (i<lim) nodes.push(children[i++]);
                wrapper=fdjtDOM("div.fdjtadjusted");
                i=0; lim=nodes.length; while (i<lim)
                    wrapper.appendChild(nodes[i++]);
                node.appendChild(wrapper);}
            var w_scale=avail_width/inside.width;
            var h_scale=avail_height/inside.height;
            var scale=((w_scale<h_scale)?(w_scale):(h_scale));
            wrapper.style[fdjtDOM.transform]="scale("+scale+","+scale+")";
            wrapper.style[fdjtDOM.transformOrigin]=origin||"50% 0%";}

        function scaleAll(){
            var all=fdjtDOM.$(".fdjtadjustfit");
            var i=0, lim=all.length; while (i<lim)
                scale_node(all[i++]);}
        
        function scaleToFit(node,fudge,origin){
            fdjtDOM.addClass(node,"fdjtadjustfit");
            if ((fudge)&&(typeof fudge !== "number")) fudge=0.9;
            if (fudge) node.setAttribute("data-fudge",fudge);
            if (origin) node.setAttribute("data-origin",origin);
            scale_node(node,fudge,origin);
            return node;}
        fdjtDOM.scaleToFit=scaleToFit;
        fdjtDOM.scaleToFit.scaleNode=fdjtDOM.scaleToFit.adjust=scale_node;
        
        function scale_revert(node,wrapper){
            if (!(wrapper)) {
                if (hasClass(node,"fdjtadjusted")) {
                    wrapper=node; node=wrapper.parentNode;}
                else wrapper=
                    ((node.firstChild.className==="fdjtadjusted")?
                     (node.firstChild):(getFirstChild(node,"fdjtadjusted")));}
            if ((node)&&(wrapper)) {
                var nodes=[], children=wrapper.childNodes;
                var i=0, lim=children.length;
                while (i<lim) nodes.push(children[i++]);
                var frag=document.createDocumentFragment();
                i=0; lim=nodes.length; while (i<lim) {
                    frag.appendChild(nodes[i++]);}
                node.replaceChild(frag,wrapper);
                return node;}
            else return false;}
        fdjtDOM.scaleToFit.revert=scale_revert;

        function revertAll(){
            var all=fdjtDOM.$(".fdjtadjusted");
            var i=0, lim=all.length; while (i<lim) {
                var wrapper=all[i++];
                scale_revert(wrapper.parentNode,wrapper);}}
        fdjtDOM.scaleToFit.revertAll=revertAll;

        fdjt.addInit(scaleAll);
        fdjtDOM.addListener(window,"resize",scaleAll);

        /* Getting various kinds of metadata */

        function getHTML(){
            var children=document.childNodes;
            var i=0; var lim=children.length;
            while (i<lim)
                if (children[i].tagName==='HTML') return children[i];
            else i++;
            return false;}
        fdjtDOM.getHTML=getHTML;

        function getHEAD(){
            var children=document.childNodes;
            var i=0; var lim=children.length;
            while (i<lim)
                if (children[i].tagName==='HTML') {
                    var grandchildren=children[i].childNodes;
                    i=0; lim=grandchildren.length;
                    while (i<lim)
                        if (grandchildren[i].tagName==='HEAD')
                            return grandchildren[i];
                    else i++;
                    return false;}
            else i++;
            return false;}
        fdjtDOM.getHEAD=getHEAD;

        var schema2tag={}, tag2schema={};
        function getMetaSchemas(){
            var links=
                ((document.getElementsByTagName)&&
                 (document.getElementsByTagName('link')))||
                ((document.head.getElementsByTagName)&&
                 (document.head.getElementsByTagName('link')))||
                (getChildren(document,'link'));
            var i=0, lim=links.length;
            while (i<lim) {
                var link=links[i++];
                if (!(link.rel)) continue;
                else if (!(link.href)) continue;
                else if (link.rel.search("schema.")===0) {
                    var tag=link.rel.slice(7);
                    var href=link.href;
                    // We let there be multiple references
                    if (tag2schema[tag])
                        fdjtLog.warn("Conflicting schemas for %s",tag);
                    else {
                        if (schema2tag[href])
                            schema2tag[href].push(tag);
                        else schema2tag[href]=[tag];
                        tag2schema[tag]=href;}}
                else continue;}}
        var app_schemas={};
        fdjtDOM.addAppSchema=function(name,spec){
            app_schemas[name]=spec;};
        
        var escapeRX=fdjtString.escapeRX;

        function getNameRX(name,foldcase){
            var prefix, schema, prefixes=[];
            if ((typeof name ==='string')&&
                (typeof foldcase==='undefined')) {
                if (name[0]==='^') {
                    foldcase=false; name=name.slice(1);}
                else if (name[0]==='~') {
                    foldcase=true; name=name.slice(1);}
                else {}}
            if (typeof foldcase === 'undefined') foldcase=true;
            if (typeof name !== 'string') return name;
            else if (name[0]==='{') {
                schema=false;
                var schema_end=name.indexOf('}');
                if (schema_end>2) schema=name.slice(1,schema_end);
                prefixes=((schema)&&(schema2tag[schema]))||[];
                return new RegExp("\\b("+escapeRX(schema)+"|"+
                                  prefixes.join("|")+")[.]"+
                                  name.slice(schema_end+1)+"\\b",
                                  ((foldcase)?("i"):("")));}
            else if (name[0]==='=') {
                // This overrides any schema expansion
                return new RegExp("\\b"+escapeRX(name=name.slice(1))+"\\b",
                                  ((foldcase)?("i"):("")));}
            else if ((name[0]==='*')&&(name[1]==='.')) {
                // This overrides any schema expansion
                return new RegExp("\\b([^.]\\.)?"+name.slice(2)+"\\b",
                                  ((foldcase)?("i"):("")));}
            else if (name.indexOf('.')>0) {
                var dot=name.indexOf('.');
                prefix=name.slice(0,dot);
                schema=app_schemas[prefix];
                if (!(schema))
                    return new RegExp("\\b"+escapeRX(name)+"\\b",
                                      ((foldcase)?("i"):("")));
                else if ((schema)&&(schema2tag[schema]))
                    prefixes=schema2tag[schema];
                else prefixes=[prefix];
                return new RegExp("\\b("+escapeRX(schema)+"|"+
                                  prefixes.join("|")+")\\."+
                                  name.slice(dot+1)+"\\b",
                                  ((foldcase)?("i"):("")));}
            else return new RegExp("\\b"+name+"\\b",((foldcase)?("i"):("")));}
            

        function getMeta(name,multiple,foldcase,dom){
            var results=[];
            var elts=((document.getElementsByTagName)?
                      (document.getElementsByTagName("META")):
                      (getChildren(document,"META")));
            var rx=getNameRX(name,foldcase);
            var i=0; while (i<elts.length) {
                var elt=elts[i++];
                if (!(elt)) continue;
                else if (!(elt.name)) continue;
                else if (elt.name.search(rx)>=0) {
                    if (multiple) {
                        if (dom) results.push(elt);
                        else results.push(elt.content);}
                    else if (dom) return elt;
                    else return elt.content;}
                else {}}
            if (multiple) return results;
            else return false;}
        fdjtDOM.getMeta=getMeta;
        fdjtDOM.getMetaElts=function(name){
            var matchcase;
            return getMeta(name,true,matchcase,true);};

        // This gets a LINK href field
        function getLink(name,multiple,foldcase,dom,attrib){
            var results=[];
            var elts=((document.getElementsByTagName)?
                      (document.getElementsByTagName("LINK")):
                      ((document.body)&&(document.body.getElementsByTagName))?
                      (document.body.getElementsByTagName("LINK")):
                      (getChildren(document,"LINK")));
            var rx=getNameRX(name,foldcase);
            var i=0; while (i<elts.length) {
                var elt=elts[i++];
                if (!(elt)) continue;
                else if (!(elt.rel)) continue;
                else if (elt.rel.search(rx)>=0) {
                    if (multiple) {
                        if (dom) results.push(elt);
                        else if (attrib)
                            results.push(elt.getAttribute("href"));
                        else results.push(elt.href);}
                    else if (dom) return elt;
                    else if (attrib)
                        return elt.getAttribute("href");
                    else return elt.href;}
                else {}}
            if (multiple) return results;
            else return false;}
        fdjtDOM.getLink=getLink;
        fdjtDOM.getLinks=function(name){return getLink(name,true);};
        fdjtDOM.getLinkElts=function(name){
            var matchcase;
            return getLink(name,true,matchcase,true);};

        /* Going forward */

        /* If there's a children property (childNodes which are elements),
           we assume that all the element-specific fields exist. */
        var havechildren=((document)&&
                          (document.body)&&
                          (document.body.childNodes)&&
                          (document.body.children));

        // NEXT goes to the next sibling or the parent's next sibling
        function next_node(node){
            while (node) {
                if (node.nextSibling)
                    return node.nextSibling;
                else node=node.parentNode;}
            return false;}
        function next_element(node){
            if (node.nextElementSibling)
                return node.nextElementSibling;
            else {
                var scan=node;
                while ((scan=scan.nextSibling)) {
                    if (!(scan)) return null;
                    else if (scan.nodeType===1) break;
                    else {}}
                return scan;}}
        function scan_next(node,test,justelts){
            if (!(test))
                if (justelts) {
                    if (havechildren) return node.nextElementSibling;
                    else return next_element(node);}
            else return next_node(node);
            var scan=((justelts)?
                      ((havechildren)?
                       (node.nextElementSibling):(next_element(node))):
                      ((node.nextSibling)||(next_node(node))));
            while (scan)
                if (test(scan)) return scan;
            else if (justelts)
                scan=((scan.nextElementSibling)||(next_element(scan)));
            else scan=((scan.nextSibling)||(next_node(scan)));
            return false;}

        // FORWARD goes to the first deepest child
        function forward_node(node){
            if ((node.childNodes)&&((node.childNodes.length)>0))
                return node.childNodes[0];
            else while (node) {
                if (node.nextSibling)
                    return node.nextSibling;
                else node=node.parentNode;}
            return false;}
        function forward_element(node,n){
            var scan, i, lim;
            if (n) {
                i=0; scan=node;
                while (i<n) {scan=forward_element(scan); i++;}
                return scan;}
            if (havechildren) {
                if ((node.children)&&(node.children.length>0)) {
                    return node.children[0];}
                if ((scan=node.nextElementSibling)) return scan;
                while ((node=node.parentNode))
                    if ((scan=node.nextElementSibling)) return scan;
                return false;}
            else {
                if (node.childNodes) {
                    var children=node.childNodes; i=0; lim=children.length;
                    while (i<lim)
                        if (((scan=children[i++]))&&((scan.nodeType===1))) return scan;}
                while ((scan=node.nextSibling)) if (scan.nodeType===1) return scan;
                while ((node=node.parentNode))
                    if ((scan=next_element(node))) return scan;
                return false;}}
        function scan_forward(node,test,justelts){
            if (!(test)) {
                if (justelts) return forward_element(node);
                else return forward_node(node);}
            var scan=((justelts)?(forward_element(node)):(forward_node(node)));
            while (scan) {
                if (test(scan)) return scan;
                else if (justelts) scan=next_element(scan);
                else scan=next_node(scan);}
            return false;}

        fdjtDOM.nextElt=next_element;
        fdjtDOM.forwardElt=forward_element;
        fdjtDOM.forward=scan_forward;
        fdjtDOM.next=scan_next;

        /* Skimming backwards */

        // PREV goes the parent if there's no previous sibling
        function prev_node(node){
            while (node) {
                if (node.previousSibling)
                    return node.previousSibling;
                else node=node.parentNode;}
            return false;}
        function previous_element(node){
            if (havechildren)
                return node.previousElementSibling;
            else {
                var scan=node;
                while ((scan=scan.previousSibling))
                    if (!(scan)) return null;
                else if (scan.nodeType===1) break;
                else {}
                if (scan) return scan;
                else return scan.parentNode;}}
        function scan_previous(node,test,justelts){
            if (!(test))
                if (justelts) {
                    if (havechildren) return node.previousElementSibling;
                    else return previous_element(node);}
            else return prev_node(node);
            var scan=((justelts)?
                      ((havechildren)?(node.previousElementSibling):
                       (previous_element(node))):
                      (prev_node(node)));
            while (scan)
                if (test(scan)) return scan;
            else if (justelts)
                scan=((havechildren)?(scan.previousElementSibling):(previous_element(scan)));
            else scan=prev_node(scan);
            return false;}

        // BACKWARD goes to the final (deepest last) child
        //  of the previous sibling
        function backward_node(node){
            if (node.previousSibling) {
                var scan=node.previousSibling;
                // If it's not an element, just return it
                if (scan.nodeType!==1) return scan;
                // Otherwise, return the last and deepest child
                while (scan) {
                    var children=scan.childNodes;
                    if (!(children)) return scan;
                    else if (children.length===0) return scan;
                    else scan=children[children.length-1];}
                return scan;}
            else return node.parentNode;}

        function backward_element(node){
            if (havechildren)
                return ((node.previousElementSibling)?
                        (get_final_child((node.previousElementSibling))):
                        (node.parentNode));
            else if ((node.previousElementSibling)||(node.previousSibling)) {
                var start=(node.previousElementSibling)||(node.previousSibling);
                if (start.nodeType===1) 
                    return get_final_child(start);
                else return start;}
            else return node.parentNode;}
        // We use a helper function because 
        function get_final_child(node){
            if (node.nodeType===1) {
                if (node.childNodes) {
                    var children=node.childNodes;
                    if (!(children.length)) return node;
                    var scan=children.length-1;
                    while (scan>=0) {
                        var child=get_final_child(children[scan--]);
                        if (child) return child;}
                    return node;}
                else return node;}
            else return false;}
        
        function scan_backward(node,test,justelts){
            if (!(test)) {
                if (justelts) return backward_element(node);
                else return backward_node(node);}
            var scan=((justelts)?
                      (backward_element(node)):
                      (backward_node(node)));
            while (scan) {
                if (test(scan)) return scan;
                else if (justelts) scan=next_element(scan);
                else scan=next_node(scan);}
            return false;}
        
        fdjtDOM.prevElt=previous_element;
        fdjtDOM.backwardElt=backward_element;
        fdjtDOM.backward=scan_backward;
        fdjtDOM.prev=scan_previous;

        /* Viewport/window functions */

        fdjtDOM.viewTop=function viewTop(win){
            if (typeof win==="string") {
                if (!(win=document.getElementById(win))) return;}
            if ((!(win))||(win===window)||
                ((window.Window)&&(win instanceof window.Window))) {
                win=win||window;
                return (win.pageYOffset||win.scrollY||
                        win.document.documentElement.scrollTop||0);}
            else return win.scrollTop;};
        
        fdjtDOM.viewLeft=function viewLeft(win){
            if (typeof win==="string") {
                if (!(win=document.getElementById(win))) return;}
            if ((!(win))||(win===window)||
                ((window.Window)&&(win instanceof window.Window))) {
                win=win||window;
                return (win.pageXOffset||win.scrollX||
                        win.document.documentElement.scrollLeft||0);}
            else return win.scrollLeft;};

        function viewHeight(win){
            if (typeof win==="string") {
                if (!(win=document.getElementById(win))) return;}
            if (!(win)) win=window;
            if (win.hasOwnProperty('innerHeight')) return win.innerHeight;
            else if ((win.document)&&(window.document.documentElement)&&
                     (window.document.documentElement.clientHeight))
                return window.document.documentElement.clientHeight;
            else return win.offsetHeight;}
        fdjtDOM.viewHeight=viewHeight;
        function viewWidth(win){
            if (typeof win==="string") {
                if (!(win=document.getElementById(win))) return;}
            if (!(win)) win=window;
            if (win.hasOwnProperty('innerWidth')) return win.innerWidth;
            else if ((win.document)&&(window.document.documentElement)&&
                     (window.document.documentElement.clientWidth))
                return window.document.documentElement.clientWidth;
            else return win.offsetWidth;}
        fdjtDOM.viewWidth=viewWidth;

        function getOrientation(win){
            if (typeof win==="string") {
                if (!(win=document.getElementById(win))) return;}
            if (!(win)) win=window;
            if (win.hasOwnProperty('orientation')) {
                if ((win.orientation===90)||(win.orientation===-90))
                    return 'landscape';
                else return 'portrait';}
            else {
                var w=viewWidth(win), h=viewHeight(win);
                if (w>h) return 'landscape';
                else return 'portrait';}}
        fdjtDOM.getOrientation=getOrientation;

        /* Generating element IDs */

        var id_count=0; var unique=Math.floor(Math.random()*100000);
        function getNodeID(elt){
            var id=elt.id; var nelt;
            if (id) return id;
            else {
                id="TMPID_"+unique+"_"+(id_count++);
                while ((!(nelt=document.getElementById(id)))||
                       (nelt===elt)) {
                    id="TMPID_"+unique+"_"+(id_count++);
                    if ((!(nelt=document.getElementById(id)))||
                        (nelt===elt))
                        unique=Math.floor(Math.random()*100000);
                    id="TMPID_"+unique+"_"+(id_count++);}
                elt.id=id;
                return id;}}
        fdjtDOM.getNodeID=getNodeID;
        
        /* Removing IDs */

        function stripIDs(node,nametoo,moveto){
            if (!(nametoo)) nametoo=false;
            if (!(moveto)) moveto=false;
            if (node.id) {
                if (moveto) node.setAttribute(moveto,node.id);
                node.id="";
                node.removeAttribute("id");}
            if ((nametoo)&&(node.name)) node.name=null;
            if ((node.childNodes)&&(node.childNodes.length)) {
                var children=node.childNodes, i=0, lim=children.length;
                while (i<lim) {
                    var child=children[i++];
                    if (child.nodeType===1)
                        stripIDs(child,nametoo,moveto);}}}
        fdjtDOM.stripIDs=stripIDs;

        /* Stylesheet manipulation */

        // Adapted from 
        // http://www.hunlock.com/blogs/Totally_Pwn_CSS_with_Javascript

        // Return requested style object
        function getCSSRule(ruleName, deleteFlag) {
            ruleName=ruleName.toLowerCase();
            // If browser can play with stylesheets
            if (document.styleSheets) {
                // For each stylesheet
                for (var i=0; i<document.styleSheets.length; i++) {
                    var styleSheet=document.styleSheets[i];
                    var cssRules=styleSheet.cssRules||styleSheet.rules;
                    var n_rules=((cssRules)&&(cssRules.length));
                    var ii=0; while (ii<n_rules) {
                        if (cssRules[ii])  {
                            var cssRule=cssRules[ii];
                            if (cssRule.selectorText.toLowerCase()===ruleName) {
                                if (deleteFlag==='delete') {
                                    if (styleSheet.cssRules) {
                                        styleSheet.deleteRule(ii);}
                                    // Delete rule IE style.
                                    return true;}
                                // found and not deleting.
                                else {return cssRule;}
                                // end found cssRule
                            }}   
                        ii++;}
                    /* end for stylesheets */ }
                return false;}
            return false;}
        fdjtDOM.getCSSRule=getCSSRule;

        function dropCSSRule(ruleName) {// Delete a CSS rule   
            return getCSSRule(ruleName,'delete');}
        fdjtDOM.dropCSSRule=dropCSSRule;

        function addCSSRule(selector,style,sheet) {// Create a new css rule
            if (!(sheet)) {
                var styles=fdjtID("FDJTSTYLES");
                if (!(styles)) {
                    var head=document.getElementsByTagName("HEAD");
                    if (head.length===0) return; else head=head[0];
                    styles=fdjtDOM("style#FDJTSTYLES");
                    head.appendChild(styles);}
                sheet=styles.sheet;}
            if (!(sheet)) return false;
            else if ((sheet.insertRule)||(sheet.addRule)) {
                var rules=sheet.cssRules||sheet.rules;
                var at=rules.length;
                if (sheet.insertRule)
                    sheet.insertRule(selector+' {'+style+'}',at);
                else sheet.addRule(selector,style,at);
                return rules[at];}
            else return false;}
        fdjtDOM.addCSSRule=addCSSRule;

        /* Check for SVG */
        var nosvg;

        function checkSVG(){
            var root=document.documentElement||document.body;
            if (typeof nosvg === "undefined") {
                if ((document.implementation)&&
                    (document.implementation.hasFeature))
                    nosvg=(!(document.implementation.hasFeature(
                        "http://www.w3.org/TR/SVG11/feature#Image",
                        "1.1")));
                else if (navigator.appName==="Microsoft Internet Explorer")
                    // SVG (or at least SVGZ) images don't seem to
                    // obey CSS scaling in IE.
                    nosvg=true;
                else if (navigator.mimeTypes["image/svg+xml"])
                    nosvg=false;
                else nosvg=true;}
            if (nosvg) {
                addClass(root,"_NOSVG");
                dropClass(root,"_USESVG");}
            else {
                dropClass(root,"_NOSVG");
                addClass(root,"_USESVG");}
            return (!(nosvg));}
        
        function checkChildren(){
            havechildren=((document)&&
                          (document.body)&&
                          (document.body.childNodes)&&
                          (document.body.children));}

        function useBMP(){
            var hasSuffix=fdjtString.hasSuffix;
            var images=fdjt.$("IMG");
            var i=0, lim=images.length;
            while (i<lim) {
                var image=images[i++]; var src=image.src;
                if (!(src)) continue;
                if ((hasSuffix(src,".svg"))||(hasSuffix(src,".svgz"))) {
                    var bmp=image.getAttribute('bmp');
                    if (bmp) {
                        image.setAttribute('svg',image.src);
                        image.src=bmp;}}}}
        function useSVG(){
            var hasSuffix=fdjtString.hasSuffix;
            var images=fdjt.$("IMG");
            var i=0, lim=images.length;
            while (i<lim) {
                var image=images[i++]; var src=image.src;
                if (!(src)) continue;
                if ((!((hasSuffix(src,".svg"))||(hasSuffix(src,".svgz"))))&&
                    (image.getAttribute('svg'))) {
                    var svg=image.getAttribute('svg');
                    image.setAttribute('bmp',image.src);
                    image.src=svg;}}}
        fdjtDOM.useSVG=useSVG;
        fdjtDOM.useBMP=useBMP;

        function prefSVG(){
            if (!(nosvg)) useSVG();}
        fdjtDOM.prefSVG=prefSVG;
        fdjtDOM.checkSVG=checkSVG;

        fdjtDOM.init=fdjt.Init;
        fdjtDOM.addInit=fdjt.addInit;
        fdjt.addInit(checkChildren,"checkChildren");
        fdjt.addInit(checkSVG,"checkSVG");

        if (navigator.userAgent.search("WebKit")>=0) {
            if (!(fdjtDOM.transition)) fdjtDOM.transition='-webkit-transition';
            if (!(fdjtDOM.transitionProperty))
                fdjtDOM.transitionProperty='-webkit-transition-property';
            if (!(fdjtDOM.transitionDuration))
                fdjtDOM.transitionDuration='-webkit-transition-duration';
            if (!(fdjtDOM.transitionDelay))
                fdjtDOM.transitionDelay='-webkit-transition-delay';
            if (!(fdjtDOM.transitionTiming))
                fdjtDOM.transitionTiming='-webkit-transition-timing-function';
            if (!(fdjtDOM.transform)) fdjtDOM.transform='-webkit-transform';
            if (!(fdjtDOM.transformOrigin))
                fdjtDOM.transformOrigin='-webkit-transform-origin';
            if (!(fdjtDOM.columnWidth)) fdjtDOM.columnWidth='-webkit-column-width';
            if (!(fdjtDOM.columnGap)) fdjtDOM.columnGap='-webkit-column-gap';}
        else if (navigator.userAgent.search("Mozilla")>=0) {
            if (!(fdjtDOM.transition)) fdjtDOM.transition='-moz-transition';
            if (!(fdjtDOM.transitionProperty))
                fdjtDOM.transitionProperty='-moz-transition-property';
            if (!(fdjtDOM.transitionDuration))
                fdjtDOM.transitionDuration='-moz-transition-duration';
            if (!(fdjtDOM.transitionDelay))
                fdjtDOM.transitionDelay='-moz-transition-delay';
            if (!(fdjtDOM.transitionTiming))
                fdjtDOM.transitionTiming='-moz-transition-timing-function';
            if (!(fdjtDOM.transform)) fdjtDOM.transform='-moz-transform';
            if (!(fdjtDOM.transformOrigin))
                fdjtDOM.transformOrigin='-moz-transform-origin';
            if (!(fdjtDOM.columnWidth)) fdjtDOM.columnWidth='MozColumnWidth';
            if (!(fdjtDOM.columnGap)) fdjtDOM.columnGap='MozColumnGap';}
        else {
            if (!(fdjtDOM.transition)) fdjtDOM.transition='transition';
            if (!(fdjtDOM.transitionProperty))
                fdjtDOM.transitionProperty='transition-property';
            if (!(fdjtDOM.transitionDuration))
                fdjtDOM.transitionDuration='transition-duration';
            if (!(fdjtDOM.transitionDelay))
                fdjtDOM.transitionDelay='transition-delay';
            if (!(fdjtDOM.transitionTiming))
                fdjtDOM.transitionTiming='transition-timing-function';
            if (!(fdjtDOM.transform)) fdjtDOM.transform='transform';
            if (!(fdjtDOM.transformOrigin))
                fdjtDOM.transformOrigin='-moz-transform-origin';}
        
        if (typeof document.hidden !== "undefined") {
            fdjtDOM.isHidden="hidden";
            fdjtDOM.vischange="visibilitychange";}
        else if (typeof document.webkitHidden !== "undefined") {
            fdjtDOM.isHidden="webkitHidden";
            fdjtDOM.vischange="webkitvisibilitychange";}
        else if (typeof document.mozHidden !== "undefined") {
            fdjtDOM.isHidden="mozHidden";
            fdjtDOM.vischange="mozvisibilitychange";}
        else if (typeof document.msHidden !== "undefined") {
            fdjtDOM.isHidden="msHidden";
            fdjtDOM.vischange="msvisibilitychange";}
        else {
            fdjtDOM.isHidden=false; fdjtDOM.vischange=false;}

        /* Selection-y functions */

        fdjtDOM.getSelectedRange=function(sel){
            if (sel) {}
            else if (window.getSelection)
                sel=window.getSelection();
            else if (document.selection)
                sel=document.selection.createRange();
            else return false;
            if (!(sel)) return false;
            if (sel.getRangeAt) {
                if (sel.rangeCount)
                    return sel.getRangeAt(0);
                else return false;}
            else if (document.createRange) {
                var range=document.createRange();
                range.setStart(sel.anchorNode,sel.anchorOffset);
                range.setEnd(sel.focusNode,sel.focusOffset);
                return range;}
            else return false;};

        fdjtDOM.rangeIsEmpty=function(range){
            if (range) {
                if ((range.startContainer===range.endContainer)&&
                    (range.startOffset===range.endOffset))
                    return true;
                else return false;}
            else return true;};

        fdjtDOM.clearSelection=function(sel){
            if (!(sel))
                sel=document.selection||window.getSelection();
            if (sel.removeAllRanges) {
                sel.removeAllRanges();}
            else if (sel.empty) {
                sel.empty();}
            else {}};

        function node2text(node,accum){
            var i, lim;
            if (!(accum)) accum="";
            if ((!(node.nodeType))&&(node.length)) {
                i=0; lim=node.length;
                while (i<lim) accum=node2text(node[i++],accum);
                return accum;}
            else if (node.nodeType===3) {
                var stringval=node.nodeValue;
                if (stringval)
                    accum=accum+stringval;
                return accum;}
            else if (node.nodeType===1) {
                var style=getStyle(node);
                var children=node.childNodes;
                if ((typeof node.className === "string")&&
                    (node.className.search(/\bfdjtskiptext\b/)>=0))
                    return accum;
                else if ((style.display==='none')||
                    (style.visibility==='hidden')||
                    (!((style.position==='static')||
                       (style.position===''))))
                    return accum;
                else {}
                i=0; lim=children.length;
                while (i<lim) {
                    var child=children[i++];
                    if (child.nodeType===3) {
                        var s=child.nodeValue;
                        if (s) accum=accum+s;}
                    else accum=node2text(child,accum);}
                return accum;}
            else return accum;}
        fdjtDOM.node2text=node2text;
        
        function get_text_pos(node,pos,cur,starting){
            var i, lim;
            if (cur>pos) return false;
            else if ((!(node.nodeType))&&(node.length)) {
                i=0; lim=node.length;
                while (i<lim) {
                    cur=get_text_pos(node[i++],pos,cur,starting);
                    if (typeof cur !== "number") return cur;}
                return cur;}
            else if (node.nodeType===3) {
                var stringval=node.nodeValue;
                if (pos<(cur+stringval.length))
                    return { node: node, off: pos-cur};
                else if (pos===(cur+stringval.length))
                    return { node: node, off: pos-cur,atend: true};
                else return cur+stringval.length;}
            else if (node.nodeType===1) {
                var style=getStyle(node);
                var children=node.childNodes;
                if ((typeof node.className === "string")&&
                    (node.className.search(/\bfdjtskiptext\b/)>=0))
                    return cur;
                else if ((style.display==='none')||
                    (style.visibility==='hidden')||
                    (!((style.position==='static')||
                       (style.position===''))))
                    return cur;
                else {}
                i=0; lim=children.length;
                while (i<lim) {
                    cur=get_text_pos(children[i++],pos,cur,starting);
                    if (typeof cur !== 'number') {
                        if ((starting)&&(cur.atend)) {
                            cur=pos; while (i<lim) {
                                var next=get_text_pos(
                                    children[i++],cur,pos,starting);
                                if ((next)&&(typeof next!=="number"))
                                    return next;}
                            return cur;}
                        else return cur;}}
                return cur;}
            else return cur;}

        function textPos(node,pos,sofar){
            var result=get_text_pos(node,pos,sofar||0);
            if (typeof result !== 'number') return result;
            else return {node: node,off: pos};}
        fdjtDOM.textPos=textPos;

        fdjtDOM.refineRange=function(range){
            if ((range.startContainer.nodeType===3)&&
                (range.endContainer.nodeType===3))
                return range;
            var start_info=textPos(range.startContainer,range.startOffset);
            var end_info=textPos(range.endContainer,range.endOffset);
            var newrange=document.createRange();
            newrange.setStart(start_info.node,start_info.off);
            newrange.setEnd(end_info.node,end_info.off);
            return newrange;};
        
        function get_text_off(scan,upto,sofar){
            if (!(sofar)) sofar=0;
            if (scan===upto) return [sofar];
            else if (scan.nodeType===3)
                return sofar+scan.nodeValue.length;
            else if (scan.nodeType===1) {
                var children=scan.childNodes;
                var i=0, lim=children.length;
                while (i<lim) {
                    var child=children[i++];
                    sofar=get_text_off(child,upto,sofar);
                    if (typeof sofar !== 'number') return sofar;}
                return sofar;}
            else return sofar;}
        function textOff(node,pos){
            var off=get_text_off(node,pos,0);
            if (off) return off[0]; else return false;}
        fdjtDOM.textOff=textOff;
        
        function getIDParent(scan) {
            while (scan) {
                if (scan.id) break;
                else scan=scan.parentNode;}
            return scan;}

        fdjtDOM.getRangeInfo=function(range,within){
            var start=range.startContainer;
            if (!(within)) within=getIDParent(start);
            var start_edge=textOff(within,start,0);
            var end=range.endContainer;
            var ends_in=((start===end)?(within):
                         (getParent(end,within))?(within):
                         (getIDParent(end)));
            var end_edge=((start===end)?(start_edge):
                          textOff(ends_in,end,0));
            return {start: start_edge+range.startOffset,
                    starts_in: within.id,ends_in: ends_in.id,
                    end: end_edge+range.endOffset};};

        function getRegexString(needle,shyphens,before,after){
            if (shyphens) {
                needle=needle.replace("­","");
                return ((before||"")+
                        (needle.replace(/\S/g,"$&­?").
                         replace(/([()\[\]\.\?\+\*])­\?/gm,"[$1]").
                         replace("­? "," ").replace(/\s+/g,"(\\s+)"))+
                        (after||""));}
            else return (((before)||(""))+
                         (needle.replace(/[()\[\]\.\?\+\*]/gm,"[$&]").replace(
                                 /\s+/g,"(\\s+)"))+
                         ((after)||("")));}
        fdjtDOM.getRegexString=getRegexString;

        function textRegExp(needle,foldcase,shyphens,before,after){
            if (typeof shyphens==="undefined") shyphens=true;
            return new RegExp(getRegexString(needle,shyphens,before,after),
                              ((foldcase)?("igm"):("gm")));}
        fdjtDOM.textRegExp=textRegExp;
        function wordRegExp(needle,foldcase,shyphens){
            if (typeof shyphens==="undefined") shyphens=true;
            return new RegExp(getRegexString(needle,shyphens,"\\b","\\b"),
                              ((foldcase)?("igm"):("gm")));}
        fdjtDOM.wordRegExp=wordRegExp;

        function findString(node,needle,off,count){
            if (typeof off === 'undefined') off=0;
            if (typeof count === 'undefined') count=1;
            needle=needle.replace(/­/mg,"");
            var match=false;
            var fulltext=node2text(node);
            var sub=((off===0)?(fulltext):(fulltext.slice(off)));
            var scan=sub.replace(/­/mg,"");
            var pat=((typeof needle === 'string')?
                     (textRegExp(needle,false,false)):
                     (needle));
            while ((match=pat.exec(scan))) {
                if (count===1) {
                    var loc=match.index;
                    if (scan!==sub) {
                        // If the text contains soft hyphens, we need
                        // to adjust *loc* (which is an offset into
                        // the string without those hyphens into an
                        // offset in the actual string in the DOM.
                        var i=0; while (i<loc) {
                            if (sub[i]==="­") loc++;
                            i++;}}
                    var absloc=loc+off;
                    var start=get_text_pos(node,absloc,0,true);
                    var end=get_text_pos(node,absloc+(match[0].length),0);
                    if ((!start)||(!end)) return false;
                    var range=document.createRange();
                    if (start.atend) {
                        var txt=firstText(start.node.nextSibling);
                        if (txt) range.setStart(txt,0);
                        else range.setStart(start.node,start.off);}
                    else range.setStart(start.node,start.off);
                    range.setEnd(end.node,end.off);
                    return range;}
                else {count--;
                      off=match.index+match[0].length;
                      scan=scan.slice(off);}}
            return false;}
        fdjtDOM.findString=findString;

        function findMatches(node,needle,off,count){
            if (typeof off === 'undefined') off=0;
            if (typeof count === 'undefined') count=-1;
            var match=false; var results=[];
            var fulltext=node2text(node);
            var scan=((off===0)?(fulltext):(fulltext.slice(off)));
            var pat=((typeof needle === 'string')?(textRegExp(needle)):
                     (needle));
            while ((count!==0)&&(match=pat.exec(scan))) {
                var loc=match.index+off;
                // var absloc=loc+off;
                var start=get_text_pos(node,loc,0);
                var end=get_text_pos(node,loc+match[0].length,0);
                if ((!start)||(!end)) return false;
                var range=document.createRange();
                if (typeof start === "number") range.setStart(node,start);
                else if (start.atend) {
                    var txt=firstText(start.node.nextSibling);
                    if (txt) range.setStart(txt,0);
                    else range.setStart(start.node,start.off);}
                else range.setStart(start.node,start.off);
                if (typeof end === "number") range.setEnd(node,end);
                else range.setEnd(end.node,end.off);
                results.push(range);
                // off=match.index+match[0].length; scan=scan.slice(off);
                count--;} 
            return results;}
        fdjtDOM.findMatches=findMatches;

        function firstText(node){
            if (!(node)) return false;
            else if (node.nodeType===3) return node;
            else if (node.nodeType===1)
                return firstText(node.firstChild);
            else return false;}

        /* Getting transition event names */

        var transition_events=[
            'transitionend','webkitTransitionEnd',
            'mozTransitionEnd','oTransitionEnd',
            'msTransitionEnd'];

        function checkTransitionEvents(){
            var div = document.createElement('div');
            if (!(div.removeEventListener)) return;
            var handler = function(e) {
                fdjtDOM.transitionEnd = e.type;
                var i=0, lim=transition_events.length;
                while (i<lim) {
                    if ((div)&&(div.removeEventListener))
                        div.removeEventListener(
                            transition_events[i++],handler);
                    else i++;}};
            div.setAttribute("style","position:absolute;top:0px;transition:top 1ms ease;-webkit-transition:top 1ms ease;-moz-transition:top 1ms ease;-o-transition:top 1ms ease;-ms-transition:top 1ms ease;");
            var i=0, lim=transition_events.length;
            while (i<lim) div.addEventListener(
                transition_events[i++], handler, false);
            document.documentElement.appendChild(div);
            setTimeout(function() {
                div.style.top = '100px';
                setTimeout(function() {
                    div.parentNode.removeChild(div);
                    div = handler = null;},
                           2000);},
                       0);}
        fdjt.addInit(checkTransitionEvents,"checkTransitionEvents");

        /* Custom input types (number, date, email, url, etc) */

        var custom_input_types=
            ["email","number","range","tel","url",
             "datetime","datetime-local","date","time","week","month"];

        function setupCustomInputs(dom){
            if (!(dom)) dom=document.body;
            var input_elt=document.createElement("input");
            var i=0, ntypes=custom_input_types.length;
            while (i<ntypes) {
                var typename=custom_input_types[i++];
                try {input_elt.type=typename;} catch (err) {}
                if (input_elt.type===typename) {
                    var inputs=getChildren(
                        document.body,".fdjt"+typename+"input");
                    var j=0, lim=inputs.length;
                    while (j<lim) {
                        var input=inputs[j++];
                        if (input.tagName!=="INPUT") continue;
                        input.type=typename;}}}}
        fdjtDOM.setupCustomInputs=setupCustomInputs;
        fdjt.addInit(setupCustomInputs,"CustomInputs");
        fdjtDOM.text_types=
            /\b(text|email|number|range|tel|url|datetime|datetime-local|date|time|week|month)\b/i;

        /* Checking media types */
        function checkMedia(){
            var media="media";
            if (window.matchMedia) {
                var mm=window.matchMedia("handheld");
                if (mm.match) media=media+" handheld";
                mm=window.matchMedia("(max-width:500px)");
                if (mm.match) media=media+" narrow";
                mm=window.matchMedia("(min-width:1000px)");
                if (mm.match) media=media+" wide";
                mm=window.matchMedia("(-webkit-min-device-pixel-ratio:1.5),(-min-resolution:15dp)");
                if (mm.match) media=media+" hires";}
            fdjt.media=media;}
        fdjt.addInit(checkMedia,"matchMedia");

        function getMediaState(){
            return window.getComputedStyle(
                document.body,':before').content;}
        fdjt.getMediaState=getMediaState;

        /* Inserting text in an text field or textarea */
        function insertText(target,text,off){
            var pos=target.selectionStart;
            var current=target.value;
            if ((current)&&(typeof pos === "number")&&(pos>=0))
                target.value=current.slice(0,pos)+text+current.slice(pos);
            else target.value=text;
            if (typeof off === "number")
                target.selectionEnd=target.selectionStart=pos+off;}
        fdjtDOM.insertText=insertText;

        /* Meta schemas */

        fdjt.addInit(getMetaSchemas,"MetaSchemas");

        /* Run inits on load */
        if ((!(fdjt.noinit))||
            ((typeof _fdjt_init === 'undefined')||(!(_fdjt_init))))
            fdjtDOM.addListener(window,"load",fdjtDOM.init);
        
        /* Playing audio */

        function playAudio(id){
            var elt=document.getElementById(id);
            if ((elt)&&(elt.play)) {
                if (!(elt.paused)) {
                    elt.pause(); elt.currentTime=0.0;}
                elt.play();}}
        fdjtDOM.playAudio=playAudio;

        /* Tweaking images */

        function tweakImage(elt,tw,th) {
            var style=elt.style;
            style.maxHeight=style.minHeight="inherit";
            style.maxWidth=style.minWidth="inherit";
            // Get width and height again, with the constraints off
            //  This means that pagescaling trumps CSS constraints,
            //  but we'll accept that for now
            var w=elt.offsetWidth, h=elt.offsetHeight, sw=tw/w, sh=th/h;
            if (sw<sh) {
                style.width=Math.round(w*sw)+"px";
                style.height="auto";}
            else {
                style.height=Math.round(h*sh)+"px";
                style.width="auto";}}
        fdjtDOM.tweakImage=tweakImage;

        /* Blob/URL functions */

        function makeBlob(string,type){
            if ((typeof string === "string")&&
                (string.search("data:")===0)) {
                if (!(type)) {
                    var typeinfo=/data:([^;]+);/.exec(string);
                    if (typeinfo) type=(typeinfo[1]);}
                var elts=string.split(',');
                var byteString = atob(elts[1]);
                if (elts[0].indexOf('base64') >= 0)
                    byteString = atob(elts[1]);
                else
                    byteString = window.unescape(elts[1]);
                var ab = new ArrayBuffer(byteString.length);
                var ia = new Uint8Array(ab);
                for (var i = 0; i < byteString.length; i++) {
                    ia[i] = byteString.charCodeAt(i);}
                return new Blob([ab], { type: type||'application' });}
            else return false;}
        fdjtString.makeBlob=makeBlob;

        function data2URL(datauri){
            if ((URL)&&(URL.createObjectURL)) 
                return URL.createObjectURL(makeBlob(datauri));
            else return datauri;}
        fdjtDOM.data2URL=data2URL;

        function addUXClasses(){
            var device=fdjt.device;
            var prefix=fdjt.cxprefix||"_";
            var html=document.documentElement;
            if (device.ios) addClass(html,prefix+"IOS");
            if (device.touch) addClass(html,prefix+"TOUCH");
            if (device.mouse) addClass(html,prefix+"MOUSE");
            if (device.android) addClass(html,prefix+"Android");}
        fdjtDOM.addUXClasses=addUXClasses;
        fdjtDOM.addUSClasses=addUXClasses;
        fdjtDOM.addCXClasses=addUXClasses;
        fdjt.addInit(addUXClasses,"AddUXClasses");

        function focusElt(id){
            var elt=document.getElementById(id);
            if (elt) setTimeout(function(){elt.focus();},10);}
        fdjtDOM.focus=focusElt;
        function blurElt(id){
            var elt=document.getElementById(id);
            if (elt) setTimeout(function(){elt.blur();},10);}
        fdjtDOM.blur=blurElt;

        function windowFocus(evt){
            evt=evt||window.event; addClass(document.body,"_FOCUS");}
        function windowBlur(evt){
            evt=evt||window.event; dropClass(document.body,"_FOCUS");}
        function trackPageFocus(){
            windowFocus(); // Could be iffy...
            addListener(window,"focus",windowFocus);
            addListener(window,"blur",windowBlur);}
        fdjt.addInit(trackPageFocus);

        fdjtDOM.trace_adjust=false;

        return fdjtDOM;
    })();

/* requestAnimationFrame polyfill */
(function() {
    "use strict";
    var lastTime = 0;
    var rAF=(window.requestAnimationFrame)&&
        (function(thunk){window.requestAnimationFrame(thunk);});
    var cAF=(window.cancelAnimationFrame)&&
        (function(thunk){window.cancelAnimationFrame(thunk);});
    var vendors = ['webkit', 'moz','ms','o'];

    function fakeAnimationFrame(callback) {
        var currTime = new Date().getTime();
        var timeToCall = Math.max(0, 16 - (currTime - lastTime));
        var id = window.setTimeout(
            function() { callback(currTime + timeToCall); },
            timeToCall);
        lastTime = currTime + timeToCall;
        return id;}
    function cancelFakeAnimationFrame(id){clearTimeout(id);}

    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        rAF=rAF||window[vendors[x]+'RequestAnimationFrame'];
        cAF=cAF||window[vendors[x]+'CancelAnimationFrame']||
            window[vendors[x]+'CancelRequestAnimationFrame'];}

    if (!(rAF)) {
        rAF=fakeAnimationFrame;
        cAF=cancelFakeAnimationFrame;}

    fdjt.DOM.rAF=fdjt.DOM.requestAnimationFrame=rAF;
    fdjt.DOM.cAF=fdjt.DOM.cancelAnimationFrame=cAF;
}());

/* Emacs local variables
   ;;;  Local variables: ***
   ;;;  compile-command: "make; if test -f ../makefile; then cd ..; make; fi" ***
   ;;;  indent-tabs-mode: nil ***
   ;;;  End: ***
*/
