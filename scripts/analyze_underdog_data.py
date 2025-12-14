#!/usr/bin/env python3
"""
Underdog Data Structure Analyzer
Documents all data types and granularity levels provided by Underdog
"""

import pandas as pd
import os
import sys
import json
from datetime import datetime
from collections import defaultdict

class UnderdogDataAnalyzer:
    def __init__(self, csv_path):
        self.csv_path = csv_path
        self.analysis = {
            'file_info': {},
            'data_categories': {},
            'granularity_levels': {},
            'field_analysis': {},
            'competitive_insights': {},
            'recommendations': {}
        }
    
    def analyze_file_structure(self):
        """Analyze the basic file structure"""
        print("🔍 ANALYZING UNDERDOG DATA STRUCTURE")
        print("=" * 60)
        
        file_size = os.path.getsize(self.csv_path)
        print(f"📁 File size: {file_size / (1024**3):.2f} GB")
        
        # Read sample for structure analysis
        sample_df = pd.read_csv(self.csv_path, nrows=10000)
        
        self.analysis['file_info'] = {
            'file_size_gb': file_size / (1024**3),
            'total_columns': len(sample_df.columns),
            'sample_rows': len(sample_df),
            'columns': list(sample_df.columns)
        }
        
        print(f"📊 Columns: {len(sample_df.columns)}")
        print(f"📄 Sample rows: {len(sample_df)}")
        
        return sample_df
    
    def categorize_data_fields(self, df):
        """Categorize fields by data type and purpose"""
        print("\n📋 CATEGORIZING DATA FIELDS")
        print("-" * 40)
        
        categories = {
            'tournament_structure': [],
            'user_identification': [],
            'draft_mechanics': [],
            'player_selection': [],
            'scoring_system': [],
            'financial_data': [],
            'temporal_data': [],
            'performance_metrics': [],
            'strategic_analytics': [],
            'administrative': []
        }
        
        for col in df.columns:
            col_lower = col.lower()
            
            # Tournament structure
            if any(keyword in col_lower for keyword in [
                'tournament', 'contest', 'entry', 'prize', 'pool', 'payout',
                'format', 'type', 'league', 'room', 'lobby'
            ]):
                categories['tournament_structure'].append(col)
            
            # User identification
            elif any(keyword in col_lower for keyword in [
                'user', 'player_id', 'username', 'account', 'customer',
                'drafter', 'participant'
            ]):
                categories['user_identification'].append(col)
            
            # Draft mechanics
            elif any(keyword in col_lower for keyword in [
                'draft', 'pick', 'round', 'position', 'order', 'time',
                'clock', 'auto', 'timeout', 'snake', 'linear'
            ]):
                categories['draft_mechanics'].append(col)
            
            # Player selection
            elif any(keyword in col_lower for keyword in [
                'player_name', 'athlete', 'nfl', 'position', 'team',
                'selected', 'available', 'roster'
            ]):
                categories['player_selection'].append(col)
            
            # Scoring system
            elif any(keyword in col_lower for keyword in [
                'points', 'score', 'fantasy', 'ppr', 'standard',
                'week', 'game', 'actual', 'projected'
            ]):
                categories['scoring_system'].append(col)
            
            # Financial data
            elif any(keyword in col_lower for keyword in [
                'fee', 'cost', 'winnings', 'profit', 'loss',
                'rake', 'payout', 'cash', 'money'
            ]):
                categories['financial_data'].append(col)
            
            # Temporal data
            elif any(keyword in col_lower for keyword in [
                'date', 'time', 'timestamp', 'created', 'updated',
                'started', 'ended', 'season', 'year'
            ]):
                categories['temporal_data'].append(col)
            
            # Performance metrics
            elif any(keyword in col_lower for keyword in [
                'rank', 'finish', 'place', 'percentile', 'performance',
                'win', 'loss', 'record'
            ]):
                categories['performance_metrics'].append(col)
            
            # Strategic analytics
            elif any(keyword in col_lower for keyword in [
                'ownership', 'leverage', 'correlation', 'value',
                'expected', 'optimal', 'efficiency', 'trend'
            ]):
                categories['strategic_analytics'].append(col)
            
            # Administrative
            else:
                categories['administrative'].append(col)
        
        # Display categorization
        for category, fields in categories.items():
            if fields:
                print(f"\n🏷️  {category.upper().replace('_', ' ')} ({len(fields)} fields):")
                for field in fields[:10]:  # Show first 10
                    print(f"   • {field}")
                if len(fields) > 10:
                    print(f"   ... and {len(fields) - 10} more")
        
        self.analysis['data_categories'] = categories
        return categories
    
    def analyze_granularity_levels(self, df):
        """Determine data granularity levels"""
        print("\n📊 ANALYZING DATA GRANULARITY")
        print("-" * 40)
        
        granularity = {
            'tournament_level': False,
            'draft_level': False, 
            'user_level': False,
            'pick_level': False,
            'weekly_level': False,
            'game_level': False
        }
        
        # Check for different granularity indicators
        columns_lower = [col.lower() for col in df.columns]
        
        if any('tournament' in col or 'contest' in col for col in columns_lower):
            granularity['tournament_level'] = True
            
        if any('draft' in col or 'room' in col for col in columns_lower):
            granularity['draft_level'] = True
            
        if any('user' in col or 'player_id' in col for col in columns_lower):
            granularity['user_level'] = True
            
        if any('pick' in col or 'round' in col for col in columns_lower):
            granularity['pick_level'] = True
            
        if any('week' in col for col in columns_lower):
            granularity['weekly_level'] = True
            
        if any('game' in col for col in columns_lower):
            granularity['game_level'] = True
        
        print("🎯 Data granularity levels detected:")
        for level, detected in granularity.items():
            status = "✅" if detected else "❌"
            print(f"   {status} {level.replace('_', ' ').title()}")
        
        self.analysis['granularity_levels'] = granularity
        return granularity
    
    def analyze_competitive_features(self, df):
        """Identify competitive advantages in the data"""
        print("\n🏆 COMPETITIVE FEATURE ANALYSIS")
        print("-" * 40)
        
        competitive_features = {
            'user_behavior_tracking': [],
            'advanced_analytics': [],
            'real_time_metrics': [],
            'historical_depth': [],
            'transparency_features': []
        }
        
        columns_lower = [col.lower() for col in df.columns]
        
        # User behavior tracking
        behavior_indicators = [
            'draft_time', 'timeout', 'auto', 'pattern', 'tendency',
            'preference', 'frequency', 'timing'
        ]
        for col in df.columns:
            if any(indicator in col.lower() for indicator in behavior_indicators):
                competitive_features['user_behavior_tracking'].append(col)
        
        # Advanced analytics
        analytics_indicators = [
            'leverage', 'correlation', 'expected', 'optimal', 'efficiency',
            'variance', 'sharpe', 'kelly', 'ev', 'roi'
        ]
        for col in df.columns:
            if any(indicator in col.lower() for indicator in analytics_indicators):
                competitive_features['advanced_analytics'].append(col)
        
        # Real-time metrics
        realtime_indicators = [
            'live', 'current', 'updated', 'real_time', 'now',
            'active', 'ongoing'
        ]
        for col in df.columns:
            if any(indicator in col.lower() for indicator in realtime_indicators):
                competitive_features['real_time_metrics'].append(col)
        
        # Historical depth
        historical_indicators = [
            'season', 'year', 'historical', 'archive', 'past',
            '2023', '2022', '2021', 'career'
        ]
        for col in df.columns:
            if any(indicator in col.lower() for indicator in historical_indicators):
                competitive_features['historical_depth'].append(col)
        
        # Transparency features
        transparency_indicators = [
            'ownership', 'popularity', 'public', 'exposed', 'visible',
            'disclosed', 'revealed'
        ]
        for col in df.columns:
            if any(indicator in col.lower() for indicator in transparency_indicators):
                competitive_features['transparency_features'].append(col)
        
        print("🎯 Competitive features found:")
        for feature_type, features in competitive_features.items():
            if features:
                print(f"\n📊 {feature_type.replace('_', ' ').title()} ({len(features)}):")
                for feature in features[:5]:
                    print(f"   • {feature}")
                if len(features) > 5:
                    print(f"   ... and {len(features) - 5} more")
        
        self.analysis['competitive_insights'] = competitive_features
        return competitive_features
    
    def generate_topdog_requirements(self):
        """Generate requirements for TopDog to match/exceed Underdog"""
        print("\n🎯 TOPDOG REQUIREMENTS TO MATCH/EXCEED UNDERDOG")
        print("=" * 60)
        
        requirements = {
            'must_have_features': [],
            'competitive_advantages': [],
            'data_infrastructure': [],
            'user_experience': []
        }
        
        # Must-have features (match Underdog)
        categories = self.analysis.get('data_categories', {})
        for category, fields in categories.items():
            if fields and category in ['tournament_structure', 'draft_mechanics', 'scoring_system']:
                requirements['must_have_features'].extend([
                    f"Comprehensive {category.replace('_', ' ')} data",
                    f"All {len(fields)} data points in {category}"
                ])
        
        # Competitive advantages (exceed Underdog)
        requirements['competitive_advantages'] = [
            "Real-time draft analytics during picks",
            "AI-powered draft recommendations",
            "Advanced correlation analysis",
            "Personalized strategy insights",
            "Historical pattern recognition",
            "Leverage optimization tools",
            "Multi-tournament portfolio tracking",
            "Social features and community insights"
        ]
        
        # Data infrastructure requirements
        requirements['data_infrastructure'] = [
            "Real-time data processing pipeline",
            "Historical data warehouse (3+ years)",
            "User behavior analytics engine",
            "Advanced statistical modeling",
            "API for third-party integrations",
            "Mobile-optimized data delivery",
            "Backup and disaster recovery",
            "GDPR/privacy compliance"
        ]
        
        # User experience enhancements
        requirements['user_experience'] = [
            "Intuitive data visualization",
            "Customizable dashboards",
            "Export capabilities (CSV, PDF)",
            "Filtering and search functionality",
            "Mobile app with full feature parity",
            "Dark/light mode options",
            "Accessibility compliance",
            "Performance optimization (sub-second load times)"
        ]
        
        for req_type, reqs in requirements.items():
            print(f"\n📋 {req_type.replace('_', ' ').upper()}:")
            for req in reqs:
                print(f"   ✓ {req}")
        
        self.analysis['recommendations'] = requirements
        return requirements
    
    def sample_data_analysis(self, df):
        """Analyze sample data for insights"""
        print("\n📊 SAMPLE DATA ANALYSIS")
        print("-" * 40)
        
        # Data types
        print("📋 Data types:")
        dtype_counts = df.dtypes.value_counts()
        for dtype, count in dtype_counts.items():
            print(f"   {dtype}: {count} columns")
        
        # Missing data
        print(f"\n❓ Missing data analysis:")
        missing_data = df.isnull().sum()
        high_missing = missing_data[missing_data > len(df) * 0.1]  # >10% missing
        if len(high_missing) > 0:
            print("   Columns with >10% missing data:")
            for col, missing in high_missing.items():
                pct = (missing / len(df)) * 100
                print(f"   • {col}: {missing:,} ({pct:.1f}%)")
        else:
            print("   ✅ All columns have <10% missing data")
        
        # Unique values analysis
        print(f"\n🔢 Unique value analysis (sample):")
        for col in df.columns[:10]:  # First 10 columns
            unique_count = df[col].nunique()
            total_count = len(df)
            if unique_count == total_count:
                print(f"   • {col}: All unique (identifier field)")
            elif unique_count < 50:
                print(f"   • {col}: {unique_count} unique values (categorical)")
            else:
                print(f"   • {col}: {unique_count:,} unique values")
    
    def export_analysis(self):
        """Export the complete analysis"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_file = f"underdog_analysis_{timestamp}.json"
        
        with open(output_file, 'w') as f:
            json.dump(self.analysis, f, indent=2, default=str)
        
        print(f"\n💾 Analysis exported to: {output_file}")
        return output_file

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 analyze_underdog_data.py <underdog_csv_file>")
        print("Example: python3 analyze_underdog_data.py /path/to/underdog_data.csv")
        return
    
    csv_path = sys.argv[1]
    
    if not os.path.exists(csv_path):
        print(f"❌ File not found: {csv_path}")
        return
    
    analyzer = UnderdogDataAnalyzer(csv_path)
    
    # Step 1: Analyze file structure
    df = analyzer.analyze_file_structure()
    
    # Step 2: Categorize data fields
    analyzer.categorize_data_fields(df)
    
    # Step 3: Analyze granularity
    analyzer.analyze_granularity_levels(df)
    
    # Step 4: Competitive analysis
    analyzer.analyze_competitive_features(df)
    
    # Step 5: Sample data insights
    analyzer.sample_data_analysis(df)
    
    # Step 6: Generate requirements
    analyzer.generate_topdog_requirements()
    
    # Step 7: Export analysis
    output_file = analyzer.export_analysis()
    
    print(f"\n✅ ANALYSIS COMPLETE!")
    print(f"📊 Found {len(df.columns)} data fields across multiple categories")
    print(f"📁 Detailed analysis saved to: {output_file}")
    print(f"\n🎯 Next steps:")
    print(f"   1. Review the analysis file")
    print(f"   2. Implement TopDog tournament database")
    print(f"   3. Design UI for historical data access")
    print(f"   4. Plan data collection strategy")

if __name__ == "__main__":
    main()