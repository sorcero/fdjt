/* -*- Mode: Javascript; -*- */

/* Copyright (C) 2009 beingmeta, inc.
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

var fdjt_jsutils_id="$Id: handlers.js 40 2009-04-30 13:31:58Z haase $";
var fdjt_jsutils_version=parseInt("$Revision: 40 $".slice(10,-1));


function fdjtAdd(object,field,value)
{
  var values;
  if (values=object[field]) 
    if (values.indexOf(value)<0)  
      object[field].push(value);
    else {}
  else object[field]=new Array(value);
}

function fdjtDrop(object,field,value)
{
  var values;
  if (!(value))
    /* Drop all values */
    if ((values=object[field])) {
      object[field]=values=new Array();
      values._nvals=0;}
    else {}
  else if ((values=object[field])) {
    var pos=values.indexOf(value);
    if (pos<0) return;
    if (nvals===0) return;
    else if (nvals===1) 
      object[field]=values=new Array();
    else values.splice(pos,1);}
  else {}
}

function fdjtTest(object,field,value)
{
  var values;
  if (!(value))
    if ((object[field]) &&
	(object[field].length>0))
      return true;
    else return false;
  else if ((values=object[field])) 
    if (values.indexOf(value)<0)
      return false;
    else return true;
  else return false;
}

function fdjtInsert(array,value)
{
  if (array.indexOf(value)<0) array.push(value);
}

function fdjtRemove(array,value,count)
{
  var pos=array.indexOf(value);
  if (pos<0) return array;
  array.splice(pos,1);
  if (count) {
    count--; while ((count>0) && ((pos=array.indexOf(value,pos))>=0)) {
      array.splice(pos,1); count--;}}
  return array;
}

/* Turning an arguments object into an array. */

function fdjtArguments(argobj,start)
{
  var i=((start) ? (start) : (0));
  var result=new Array(argobj.length-i);
  while (i<argobj.length) {
    result[i]=argobj[i]; i++;}
  return result;
}

/* Fast set operations */

function _fdjt_set_sortfn(a,b)
{
  if (a===b) return 0;
  else if (typeof a === typeof b)
    if (a<b) return -1; else return 1;
  else if (typeof a < typeof b)
    return -1;
  else return 1;
}

function _fdjt_length_sortfn(a,b)
{
  if (a.length===b.length) return 0;
  else if (a.length<b.length) return -1;
  else return 1;
}

function fdjtSet(arg,destructive)
{
  if (!(arg)) return new Array();
  else if (arg instanceof Array)
    if (arg.length<2) return arg;
    else if ((arg._sortlen) && ((arg._sortlen) === (arg.length)))
      return arg;
    else {
      if (!(destructive)) arg=arg.slice(0);
      arg.sort(_fdjt_set_sortfn);
      var read=1; var write=1; var len=arg.length;
      var cur=arg[0];
      while (read<len) 
	if (arg[read]===cur) read++;
	else cur=arg[write++]=arg[read++];
      arg._sortlen=write;
      arg.length=write;
      return arg;}
  else return new Array(arg);
}

function fdjt_intersect(set1,set2)
{
  var results=new Array();
  var i=0; var j=0; var len1=set1.length; var len2=set2.length;
  while ((i<len1) && (j<len2))
    if (set1[i]===set2[j]) {
      results.push(set1[i]); i++; j++;}
    else if (_fdjt_set_sortfn(set1[i],set2[j])<0) i++;
    else j++;
  results._sortlen=results.length;
  return results;
}

function fdjtIntersect()
{
  if (arguments.length===0) return new Array();
  else if (arguments.length===1)
    return fdjtSet(arguments[0],true);
  else if (arguments.length===2)
    return fdjt_intersect(fdjtSet(arguments[0],true),
			  fdjtSet(arguments[1],true));
  else {
    var i=0; while (i<arguments.length)
	       if (!(arguments[i])) return new Array();
	       else if ((typeof arguments[i] === "object") &&
			(arguments[i] instanceof Array) &&
			(arguments[i].length===0))
		 return new Array();
	       else i++;
    var copied=arguments.slice(0);
    copied.sort(fdjt_len_sortfn);
    var results=fdjtSet(copied[0],true);
    i=1; while (i<copied.length) {
      results=fdjt_intersect(results,fdjtSet(copied[i++],true));
      if (results.length===0) return results;}
    return results;}
}

function fdjt_union(set1,set2)
{
  var results=new Array();
  var i=0; var j=0; var len1=set1.length; var len2=set2.length;
  while ((i<len1) && (j<len2))
    if (set1[i]===set2[j]) {
      results.push(set1[i]); i++; j++;}
    else if (_fdjt_set_sortfn(set1[i],set2[j])<0)
      results.push(set1[i++]);
    else results.push(set2[j++]);
  while (i<len1) results.push(set1[i++]);
  while (j<len2) results.push(set2[j++]);
  results._sortlen=results.length;
  return results;
}

function fdjtUnion()
{
  if (arguments.length===0) return new Array();
  else if (arguments.length===1) return fdjtSet(arguments[0]);
  else if (arguments.length===2)
    return fdjt_union(fdjtSet(arguments[0],true),
		      fdjtSet(arguments[1],true));
  else {
    var result=fdjtSet(arguments[0],true);
    var i=1; while (i<arguments.length) {
      result=fdjt_union(result,fdjtSet(arguments[i++],true));}
    return result;}
}

function fdjtDifference(set1,set2)
{
  var results=new Array();
  var i=0; var j=0;
  set1=fdjtSet(set1); set2=fdjtSet(set2);
  var len1=set1.length; var len2=set2.length;
  while ((i<len1) && (j<len2))
    if (set1[i]===set2[j]) {
      i++; j++;}
    else if (_fdjt_set_sortfn(set1[i],set2[j])<0)
      results.push(set1[i++]);
    else j++;
  while (i<len1) results.push(set1[i++]);
  results._sortlen=results.length;
  return results;
}

// This could be faster, but we can do that later
function fdjtOverlaps(set1,set2)
{
  var i=0; var j=0;
  set1=fdjtSet(set1); set2=fdjtSet(set2);
  var len1=set1.length; var len2=set2.length;
  while ((i<len1) && (j<len2))
    if (set1[i]===set2[j]) return true;
    else if (_fdjt_set_sortfn(set1[i],set2[j])<0) i++;
    else j++;
  return false;
}

// So could this
function fdjtOverlap(set1,set2)
{
  var i=0; var j=0; var overlap=0;
  set1=fdjtSet(set1); set2=fdjtSet(set2);
  var len1=set1.length; var len2=set2.length;
  while ((i<len1) && (j<len2))
    if (set1[i]===set2[j]) overlap++;
    else if (_fdjt_set_sortfn(set1[i],set2[j])<0) i++;
    else j++;
  return overlap;
}
