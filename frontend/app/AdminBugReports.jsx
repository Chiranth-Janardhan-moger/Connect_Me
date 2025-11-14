import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { apiCall } from '../src/config/api';
import { showSuccessAlert, showErrorAlert, showConfirmAlert } from './components/CustomAlert';

const AdminBugReports = () => {
  const router = useRouter();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // all, pending, reviewed, resolved

  useEffect(() => {
    fetchReports();
  }, [filter]);

  const fetchReports = async () => {
    try {
      const endpoint = filter === 'all' 
        ? '/api/bug-reports/all'
        : `/api/bug-reports/all?status=${filter}`;
      
      const response = await apiCall(endpoint, { method: 'GET' });

      if (response.ok) {
        setReports(response.data.reports || []);
      } else {
        showErrorAlert('Error', 'Failed to fetch bug reports');
      }
    } catch (error) {
      console.error('Fetch bug reports error:', error);
      showErrorAlert('Error', 'Network error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchReports();
  };

  const updateStatus = async (reportId, newStatus) => {
    try {
      const response = await apiCall(`/api/bug-reports/${reportId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        showSuccessAlert('Success', `Report marked as ${newStatus}`);
        fetchReports();
      } else {
        showErrorAlert('Error', 'Failed to update status');
      }
    } catch (error) {
      console.error('Update status error:', error);
      showErrorAlert('Error', 'Network error');
    }
  };

  const deleteReport = async (reportId) => {
    showConfirmAlert(
      'Delete Report',
      'Are you sure you want to delete this bug report?',
      async () => {
        try {
          const response = await apiCall(`/api/bug-reports/${reportId}`, {
            method: 'DELETE',
          });

          if (response.ok) {
            showSuccessAlert('Success', 'Bug report deleted');
            fetchReports();
          } else {
            showErrorAlert('Error', 'Failed to delete report');
          }
        } catch (error) {
          console.error('Delete report error:', error);
          showErrorAlert('Error', 'Network error');
        }
      }
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'reviewed': return '#3b82f6';
      case 'resolved': return '#22c55e';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return 'time-outline';
      case 'reviewed': return 'eye-outline';
      case 'resolved': return 'checkmark-circle-outline';
      default: return 'help-circle-outline';
    }
  };

  const renderReport = (report) => (
    <View key={report._id} style={styles.reportCard}>
      {/* Header */}
      <View style={styles.reportHeader}>
        <View style={styles.reportHeaderLeft}>
          <Ionicons name="bug" size={20} color="#ef4444" />
          <View style={styles.reportUserInfo}>
            <Text style={styles.reportUserName}>{report.userName}</Text>
            <Text style={styles.reportUserRole}>{report.userRole}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(report.status)}20` }]}>
          <Ionicons name={getStatusIcon(report.status)} size={14} color={getStatusColor(report.status)} />
          <Text style={[styles.statusText, { color: getStatusColor(report.status) }]}>
            {report.status}
          </Text>
        </View>
      </View>

      {/* Message */}
      <Text style={styles.reportMessage}>{report.message}</Text>

      {/* Timestamp */}
      <Text style={styles.reportTime}>
        {new Date(report.timestamp).toLocaleString()}
      </Text>

      {/* Actions */}
      <View style={styles.reportActions}>
        {report.status !== 'reviewed' && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#3b82f6' }]}
            onPress={() => updateStatus(report._id, 'reviewed')}
          >
            <Ionicons name="eye" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>Mark Reviewed</Text>
          </TouchableOpacity>
        )}
        {report.status !== 'resolved' && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#22c55e' }]}
            onPress={() => updateStatus(report._id, 'resolved')}
          >
            <Ionicons name="checkmark-circle" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>Mark Resolved</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#ef4444' }]}
          onPress={() => deleteReport(report._id)}
        >
          <Ionicons name="trash" size={16} color="#fff" />
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ef4444" />
        <Text style={styles.loadingText}>Loading bug reports...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#ef4444" />

      {/* Header */}
      <LinearGradient
        colors={['#ef4444', '#dc2626']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={styles.headerTitleRow}>
            <Ionicons name="bug" size={32} color="#fff" />
            <Text style={styles.headerTitle}>Bug Reports</Text>
          </View>
          <Text style={styles.headerSubtitle}>
            {reports.length} report{reports.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </LinearGradient>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {['all', 'pending', 'reviewed', 'resolved'].map((status) => (
            <TouchableOpacity
              key={status}
              style={[styles.filterTab, filter === status && styles.filterTabActive]}
              onPress={() => setFilter(status)}
            >
              <Text style={[styles.filterTabText, filter === status && styles.filterTabTextActive]}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Reports List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#ef4444']} />}
      >
        {reports.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-circle-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyText}>No bug reports</Text>
            <Text style={styles.emptySubtext}>
              {filter === 'all' ? 'No reports submitted yet' : `No ${filter} reports`}
            </Text>
          </View>
        ) : (
          reports.map(renderReport)
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    paddingTop: 48,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerContent: {
    marginLeft: 4,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  filterContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterScroll: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
  },
  filterTabActive: {
    backgroundColor: '#ef4444',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  filterTabTextActive: {
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  reportCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reportHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  reportUserInfo: {
    flex: 1,
  },
  reportUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  reportUserRole: {
    fontSize: 12,
    color: '#6b7280',
    textTransform: 'capitalize',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  reportMessage: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
  },
  reportTime: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 12,
  },
  reportActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
});

export default AdminBugReports;
