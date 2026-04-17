import React, { useState } from 'react';
import { useGameStore, Farm } from '../store/gameStore';
import { X, Edit2, Check, Plus, Trash2, MapPin } from 'lucide-react';

interface FarmCardProps {
  farm: Farm;
  isActive: boolean;
  onSwitch: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
}

export function FarmCard({ farm, isActive, onSwitch, onRename, onDelete }: FarmCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(farm.name);

  const handleSave = () => {
    if (editName.trim()) {
      onRename(editName.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditName(farm.name);
    setIsEditing(false);
  };

  return (
    <div
      className={`relative bg-white rounded-2xl p-4 shadow-lg border-2 transition-all cursor-pointer ${
        isActive ? 'border-green-500 shadow-xl scale-105' : 'border-slate-100 hover:border-green-300'
      }`}
      onClick={() => !isEditing && onSwitch()}
    >
      {/* Farm Icon */}
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center mb-3 mx-auto">
        <MapPin className="w-6 h-6 text-white" />
      </div>

      {/* Farm Name */}
      {isEditing ? (
        <div className="flex items-center gap-2 mb-2">
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') handleCancel(); }}
            onBlur={() => handleSave()}
            className="flex-1 px-2 py-1 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={(e) => { e.stopPropagation(); handleSave(); }}
            className="p-1 text-green-600 hover:bg-green-50 rounded"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleCancel(); }}
            className="p-1 text-slate-400 hover:bg-slate-100 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-2 mb-2">
          <h3 className="font-bold text-slate-800 text-center">{farm.name}</h3>
          <button
            onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded"
          >
            <Edit2 className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Farm Stats */}
      <div className="flex justify-center gap-3 text-xs text-slate-500 mb-3">
        <span>🐑 {farm.sheepList.length}</span>
        <span>围栏 {farm.fences.length}</span>
        <span>第{farm.dayCount}天</span>
      </div>

      {/* Active Indicator */}
      {isActive && (
        <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
          当前
        </div>
      )}

      {/* Delete Button */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="absolute top-2 left-2 p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
        title="删除牧场"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

interface FarmSelectorProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FarmSelector({ isOpen, onClose }: FarmSelectorProps) {
  const farms = useGameStore((state) => state.farms);
  const currentFarmId = useGameStore((state) => state.currentFarmId);
  const switchFarm = useGameStore((state) => state.switchFarm);
  const renameFarm = useGameStore((state) => state.renameFarm);
  const deleteFarm = useGameStore((state) => state.deleteFarm);
  const createFarm = useGameStore((state) => state.createFarm);

  const [showCreate, setShowCreate] = useState(false);
  const [newFarmName, setNewFarmName] = useState('');

  const handleCreate = () => {
    if (newFarmName.trim()) {
      createFarm(newFarmName.trim());
      setNewFarmName('');
      setShowCreate(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-800">选择牧场</h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Farm Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {farms.map((farm) => (
            <div key={farm.id} className="group relative">
              <FarmCard
                farm={farm}
                isActive={farm.id === currentFarmId}
                onSwitch={() => {
                  switchFarm(farm.id);
                  onClose();
                }}
                onRename={(name) => renameFarm(farm.id, name)}
                onDelete={() => {
                  if (farms.length > 1) {
                    deleteFarm(farm.id);
                  }
                }}
              />
              {farms.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteFarm(farm.id);
                  }}
                  className="absolute top-2 left-2 p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  title="删除牧场"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Create New Farm */}
        {showCreate ? (
          <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl">
            <input
              type="text"
              value={newFarmName}
              onChange={(e) => setNewFarmName(e.target.value)}
              placeholder="输入牧场名称..."
              className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
            <button
              onClick={handleCreate}
              disabled={!newFarmName.trim()}
              className="px-4 py-2 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              创建
            </button>
            <button
              onClick={() => {
                setShowCreate(false);
                setNewFarmName('');
              }}
              className="p-2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowCreate(true)}
            className="w-full p-4 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:border-green-300 hover:text-green-600 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            <span className="font-bold">创建新牧场</span>
          </button>
        )}
      </div>
    </div>
  );
}