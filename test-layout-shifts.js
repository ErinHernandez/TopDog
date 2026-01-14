/**
 * Layout Shift Testing Script
 * 
 * Run this in browser console to measure layout shifts
 * Copy and paste into browser DevTools console
 */

(function() {
  'use strict';
  
  console.log('🔍 Layout Shift Testing Tool');
  console.log('============================\n');
  
  // Find elements
  const progressSection = document.querySelector('.vx2-progress-section');
  const button = document.querySelector('.vx2-tournament-button');
  const stats = document.querySelector('.vx2-tournament-stats');
  const bottomSection = document.querySelector('.vx2-tournament-bottom-section');
  
  if (!bottomSection) {
    console.error('❌ .vx2-tournament-bottom-section not found!');
    console.log('Make sure the page has loaded and you\'re on the lobby tab.');
    return;
  }
  
  console.log('✅ Found bottom section component');
  console.log('📊 Current element positions:\n');
  
  // Measure function
  const measure = () => {
    const results = {};
    
    if (progressSection) {
      const rect = progressSection.getBoundingClientRect();
      results.progress = {
        top: Math.round(rect.top),
        left: Math.round(rect.left),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      };
    }
    
    if (button) {
      const rect = button.getBoundingClientRect();
      results.button = {
        top: Math.round(rect.top),
        left: Math.round(rect.left),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      };
    }
    
    if (stats) {
      const rect = stats.getBoundingClientRect();
      results.stats = {
        top: Math.round(rect.top),
        left: Math.round(rect.left),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      };
    }
    
    return results;
  };
  
  // Initial measurement
  const initial = measure();
  console.log('Initial positions:');
  console.table(initial);
  
  // Check CSS Grid
  const computedStyle = window.getComputedStyle(bottomSection);
  console.log('\n📐 CSS Grid Properties:');
  console.log('  display:', computedStyle.display);
  console.log('  grid-template-rows:', computedStyle.gridTemplateRows);
  console.log('  gap:', computedStyle.gap);
  console.log('  contain:', computedStyle.contain);
  
  // Check button dimensions
  if (button) {
    const buttonStyle = window.getComputedStyle(button);
    console.log('\n🔘 Button Properties:');
    console.log('  height:', buttonStyle.height);
    console.log('  min-height:', buttonStyle.minHeight);
    console.log('  max-height:', buttonStyle.maxHeight);
    console.log('  margin-bottom:', buttonStyle.marginBottom);
  }
  
  // Store initial positions globally for comparison
  window._layoutTestInitial = initial;
  
  // Create comparison function
  window._compareLayout = function() {
    const current = measure();
    const initial = window._layoutTestInitial;
    
    if (!initial) {
      console.error('❌ No initial measurement found. Run this script first.');
      return;
    }
    
    console.log('\n📊 Layout Shift Analysis:');
    console.log('========================\n');
    
    const shifts = {};
    
    if (initial.progress && current.progress) {
      shifts.progress = {
        top: current.progress.top - initial.progress.top,
        left: current.progress.left - initial.progress.left,
      };
    }
    
    if (initial.button && current.button) {
      shifts.button = {
        top: current.button.top - initial.button.top,
        left: current.button.left - initial.button.left,
      };
    }
    
    if (initial.stats && current.stats) {
      shifts.stats = {
        top: current.stats.top - initial.stats.top,
        left: current.stats.left - initial.stats.left,
      };
    }
    
    console.log('Shifts (pixels):');
    console.table(shifts);
    
    // Check if shifts are acceptable (< 1px)
    const maxShift = Math.max(
      Math.abs(shifts.progress?.top || 0),
      Math.abs(shifts.progress?.left || 0),
      Math.abs(shifts.button?.top || 0),
      Math.abs(shifts.button?.left || 0),
      Math.abs(shifts.stats?.top || 0),
      Math.abs(shifts.stats?.left || 0)
    );
    
    if (maxShift < 1) {
      console.log('\n✅ SUCCESS: All shifts < 1px (stable layout)');
    } else if (maxShift < 5) {
      console.log('\n⚠️  WARNING: Some shifts detected (1-5px)');
    } else {
      console.log('\n❌ FAILURE: Significant shifts detected (>5px)');
    }
    
    return shifts;
  };
  
  console.log('\n✅ Testing tool ready!');
  console.log('\n📝 Instructions:');
  console.log('1. Trigger a viewport change (resize window, open/close panel)');
  console.log('2. Run: _compareLayout()');
  console.log('3. Check the results above');
  
  return {
    initial,
    measure,
    compare: window._compareLayout,
  };
})();
