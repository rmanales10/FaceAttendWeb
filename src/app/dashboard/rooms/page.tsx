'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { roomService, Room } from '@/lib/firestore';
import DeleteConfirmationModal from '@/components/Modals/DeleteConfirmationModal';
import { useToast } from '@/components/Toast/Toast';
import {
    Plus,
    Search,
    Edit,
    Trash2,
    Eye,
    Building2,
    X,
    Save
} from 'lucide-react';

export default function RoomsPage() {
    const { showToast } = useToast();
    const [rooms, setRooms] = useState<Room[]>([]);
    const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);
    const [roomToEdit, setRoomToEdit] = useState<Room | null>(null);
    const [roomToView, setRoomToView] = useState<Room | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [formData, setFormData] = useState({
        room_code: ''
    });

    useEffect(() => {
        fetchRooms();
    }, []);

    useEffect(() => {
        filterRooms();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rooms, searchQuery]);

    const fetchRooms = async () => {
        try {
            setLoading(true);
            const data = await roomService.getAllRooms();
            setRooms(data);
        } catch (error) {
            console.error('Error fetching rooms:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterRooms = useCallback(() => {
        let filtered = rooms;

        // Apply search filter
        if (searchQuery.trim()) {
            filtered = filtered.filter(room =>
                room.room_code.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        setFilteredRooms(filtered);
    }, [rooms, searchQuery]);

    const handleViewRoom = (room: Room) => {
        setRoomToView(room);
        setShowViewModal(true);
    };

    const handleEditRoom = (room: Room) => {
        setRoomToEdit(room);
        setFormData({
            room_code: room.room_code
        });
        setShowEditModal(true);
    };

    const handleDeleteRoom = (room: Room) => {
        setRoomToDelete(room);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!roomToDelete?.id) return;

        setIsDeleting(true);
        try {
            await roomService.deleteRoom(roomToDelete.id);
            await fetchRooms();
            setShowDeleteModal(false);
            setRoomToDelete(null);
        } catch (error) {
            console.error('Error deleting room:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    const closeDeleteModal = () => {
        setShowDeleteModal(false);
        setRoomToDelete(null);
    };

    const closeViewModal = () => {
        setShowViewModal(false);
        setRoomToView(null);
    };

    const closeEditModal = () => {
        setShowEditModal(false);
        setRoomToEdit(null);
        setFormData({
            room_code: ''
        });
    };

    const handleUpdateRoom = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!roomToEdit?.id) return;

        setIsUpdating(true);
        try {
            const roomData = {
                room_code: formData.room_code
            };

            await roomService.updateRoom(roomToEdit.id, roomData);
            await fetchRooms();
            closeEditModal();
        } catch (error) {
            console.error('Error updating room:', error);
            showToast('Error updating room. Please try again.', 'error', 5000);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const roomData = {
                room_code: formData.room_code.toUpperCase()
            };

            await roomService.addRoom(roomData);
            await fetchRooms();
            setShowAddModal(false);
            setFormData({
                room_code: ''
            });
        } catch (error) {
            console.error('Error adding room:', error);
            showToast('Error adding room. Please try again.', 'error', 5000);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCloseModal = () => {
        setShowAddModal(false);
        setFormData({
            room_code: ''
        });
    };

    if (loading) {
        return (
            <div className="p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
                <div className="animate-pulse">
                    <div className="h-6 sm:h-8 bg-slate-200 rounded-2xl w-2/3 sm:w-1/4 mb-4 sm:mb-6"></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100">
                                <div className="text-center">
                                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-200 rounded-xl sm:rounded-2xl mx-auto mb-4 sm:mb-6"></div>
                                    <div className="h-5 sm:h-6 bg-slate-200 rounded-xl w-3/4 mx-auto mb-3 sm:mb-4"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
            {/* Header */}
            <div className="mb-6 sm:mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-1 sm:mb-2">Rooms Management</h1>
                        <p className="text-sm sm:text-base text-slate-600">Track and manage room records</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl border border-blue-100 text-center sm:text-left">
                            <span className="text-slate-700 font-semibold text-sm sm:text-base">
                                Total Rooms: {rooms.length}
                            </span>
                        </div>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
                        >
                            <Plus className="w-5 h-5" />
                            <span className="font-medium text-sm sm:text-base">Add New Room</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Search Section */}
            <div className="mb-6">
                <div className="bg-gradient-to-r from-white to-slate-50 rounded-2xl shadow-sm border border-slate-200 p-4">
                    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                        {/* Search Bar */}
                        <div className="relative group sm:flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-blue-500 transition-colors duration-200" />
                            <input
                                type="text"
                                placeholder="Search rooms..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-slate-800 placeholder-slate-400 text-sm shadow-sm hover:shadow-md"
                            />
                        </div>

                        {/* Clear Filters Button */}
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all duration-200 text-sm font-medium flex items-center space-x-1.5 shadow-sm hover:shadow-md"
                            >
                                <X className="w-3.5 h-3.5" />
                                <span>Clear</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Rooms Table */}
            {filteredRooms.length === 0 ? (
                <div className="text-center py-16">
                    <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <Building2 className="w-10 h-10 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-700 mb-3">No rooms found</h3>
                    <p className="text-slate-500 max-w-md mx-auto">
                        {searchQuery ? 'Try adjusting your search criteria' : 'Get started by adding your first room'}
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Room Code
                                    </th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {filteredRooms.map((room, index) => (
                                    <tr key={room.id} className={`hover:bg-slate-50 transition-colors duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-25'}`}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center border-2 border-white shadow-sm">
                                                    <Building2 className="w-6 h-6 text-blue-600" />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-semibold text-slate-800">{room.room_code}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <div className="flex items-center justify-center space-x-1">
                                                <button
                                                    onClick={() => handleViewRoom(room)}
                                                    className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-md transition-all duration-200 hover:scale-110"
                                                    title="View Room"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleEditRoom(room)}
                                                    className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-md transition-all duration-200 hover:scale-110"
                                                    title="Edit Room"
                                                >
                                                    <Edit className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteRoom(room)}
                                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-all duration-200 hover:scale-110"
                                                    title="Delete Room"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Add Room Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
                        {/* Modal Header with Gradient */}
                        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-white">Add New Room</h2>
                                    <p className="text-blue-100 text-sm">Create a new room record</p>
                                </div>
                                <button
                                    onClick={handleCloseModal}
                                    className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-xl transition-all duration-200"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="p-4">
                            {/* Form */}
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="group">
                                    <label htmlFor="room_code" className="text-xs font-semibold text-slate-700 mb-2 flex items-center space-x-1">
                                        <Building2 className="w-3 h-3 text-blue-500" />
                                        <span>Room Code</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            id="room_code"
                                            name="room_code"
                                            value={formData.room_code}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 focus:border-blue-500 focus:bg-white transition-all duration-200 text-slate-800 placeholder-slate-400 text-sm uppercase"
                                            placeholder="e.g., MSC06"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Form Actions */}
                                <div className="flex items-center space-x-3 pt-4 border-t border-slate-200">
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        className="flex-1 px-4 py-2 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 rounded-lg hover:from-slate-200 hover:to-slate-300 transition-all duration-200 font-medium text-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center space-x-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                                <span>Adding...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-3 h-3" />
                                                <span>Add Room</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* View Room Modal */}
            {showViewModal && roomToView && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                        <div className="p-4">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-bold text-slate-800">Room Details</h2>
                                <button
                                    onClick={closeViewModal}
                                    className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all duration-200"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Room Info */}
                            <div className="space-y-4">
                                <div className="flex items-center space-x-4">
                                    <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center border-2 border-white shadow-sm">
                                        <Building2 className="w-8 h-8 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-800">{roomToView.room_code}</h3>
                                        <p className="text-slate-500 text-sm">Room</p>
                                    </div>
                                </div>

                                <div className="bg-slate-50 rounded-lg p-3">
                                    <div className="flex items-center space-x-2 mb-1">
                                        <Building2 className="w-4 h-4 text-blue-500" />
                                        <span className="text-xs font-medium text-slate-600">Room Code</span>
                                    </div>
                                    <p className="text-sm font-semibold text-slate-800">{roomToView.room_code}</p>
                                </div>
                            </div>

                            {/* Modal Actions */}
                            <div className="flex items-center space-x-3 pt-4 border-t border-slate-200 mt-4">
                                <button
                                    onClick={closeViewModal}
                                    className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-all duration-200 font-medium text-sm"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={() => {
                                        closeViewModal();
                                        handleEditRoom(roomToView);
                                    }}
                                    className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-2 rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 font-medium text-sm"
                                >
                                    Edit Room
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Room Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
                        {/* Modal Header with Gradient */}
                        <div className="bg-gradient-to-r from-emerald-500 to-green-600 px-6 py-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-white">Edit Room</h2>
                                    <p className="text-emerald-100 text-sm">Update room information</p>
                                </div>
                                <button
                                    onClick={closeEditModal}
                                    className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-xl transition-all duration-200"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="p-4">
                            {/* Form */}
                            <form onSubmit={handleUpdateRoom} className="space-y-4">
                                <div className="group">
                                    <label htmlFor="edit_room_code" className="text-xs font-semibold text-slate-700 mb-2 flex items-center space-x-1">
                                        <Building2 className="w-3 h-3 text-blue-500" />
                                        <span>Room Code</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            id="edit_room_code"
                                            name="room_code"
                                            value={formData.room_code}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 focus:border-blue-500 focus:bg-white transition-all duration-200 text-slate-800 placeholder-slate-400 text-sm uppercase"
                                            placeholder="e.g., MSC06"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Form Actions */}
                                <div className="flex items-center space-x-3 pt-4 border-t border-slate-200">
                                    <button
                                        type="button"
                                        onClick={closeEditModal}
                                        className="flex-1 px-4 py-2 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 rounded-lg hover:from-slate-200 hover:to-slate-300 transition-all duration-200 font-medium text-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isUpdating}
                                        className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 text-white px-4 py-2 rounded-lg hover:from-emerald-600 hover:to-green-700 transition-all duration-200 flex items-center justify-center space-x-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
                                    >
                                        {isUpdating ? (
                                            <>
                                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                                <span>Updating...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-3 h-3" />
                                                <span>Update Room</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <DeleteConfirmationModal
                isOpen={showDeleteModal}
                onClose={closeDeleteModal}
                onConfirm={confirmDelete}
                title="Delete Room"
                message="Are you sure you want to delete this room? This action cannot be undone and will permanently remove the room from the system."
                itemName={roomToDelete ? roomToDelete.room_code : undefined}
                isLoading={isDeleting}
                confirmText="Delete Room"
                cancelText="Cancel"
            />
        </div>
    );
}

