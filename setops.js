/* Copyright (C) 2008-2009 beingmeta, inc.
   This file is a part of the FDJT web toolkit (www.fdjt.org)
   This file implements (relatively) fast set operations using
    Javascript arrays to represent sets.
*/

var fdjt_setops_id="$Id$";
var fdjt_setops_version=parseInt("$Revision$".slice(10,-1));

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
  var i=0; var j=0; var len1=set1.length; var len2=set2.length;
  while ((i<len1) && (j<len2))
    if (set1[i]===set2[j]) {
      i++; j++;}
    else if (_fdjt_set_sortfn(set1[i],set2[j])<0)
      results.push(set1[i++]);
    else j++;
  while (i<len1) results.push(set1[i++]);
  return results;
}

// This could be faster, but we can do that later
function fdjtOverlaps(set1,set2)
{
  var i=0; var j=0; var len1=set1.length; var len2=set2.length;
  while ((i<len1) && (j<len2))
    if (set1[i]===set2[j]) return true;
    else if (_fdjt_set_sortfn(set1[i],set2[j])<0) i++;
    else j++;
  return false;
}