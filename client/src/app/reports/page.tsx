'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { api } from '@/lib/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

const COLORS = ['#8B0000', '#DC143C', '#FF6347', '#FF8C00', '#FFD700',
  '#32CD32', '#008080', '#4169E1', '#6A5ACD', '#8B008B', '#FF69B4', '#A0522D'];

export default function ReportsPage() {
  const [deptStats, setDeptStats] = useState<any>(null);
  const [demographics, setDemographics] = useState<any>(null);
  const [trends, setTrends] = useState<any>(null);

  useEffect(() => {
    api.getDepartmentStats().then(setDeptStats).catch(() => {});
    api.getDemographics().then(setDemographics).catch(() => {});
    api.getTrends(30).then(setTrends).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reports & Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Health trends, demographics, and department statistics.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Department Distribution */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Patients by Department</h3>
          {deptStats?.current?.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={deptStats.current}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department" angle={-45} textAnchor="end" height={100} fontSize={10} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8B0000" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>
          )}
        </Card>

        {/* Gender Distribution */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Gender Distribution</h3>
          {demographics?.current?.gender?.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={demographics.current.gender}
                  dataKey="count"
                  nameKey="gender"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ gender, count }: any) => `${gender}: ${count}`}
                >
                  {demographics.current.gender.map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>
          )}
        </Card>

        {/* Age Distribution */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Age Distribution</h3>
          {demographics?.current?.age?.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={demographics.current.age}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="age_group" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#4169E1" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>
          )}
        </Card>

        {/* Daily Trend */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Daily Prescriptions (Last 30 Days)</h3>
          {trends?.daily?.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trends.daily}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={10} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#32CD32" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>
          )}
        </Card>
      </div>

      {/* Historical Data Section */}
      {(deptStats?.historical?.length > 0 || demographics?.historical?.gender?.length > 0) && (
        <>
          <h2 className="text-xl font-bold mt-8">Historical Data (Imported)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {deptStats?.historical?.length > 0 && (
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Historical — By Department</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={deptStats.historical}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="department" angle={-45} textAnchor="end" height={100} fontSize={10} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#FF8C00" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            )}
            {demographics?.historical?.gender?.length > 0 && (
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Historical — Gender</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={demographics.historical.gender}
                      dataKey="count"
                      nameKey="gender"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {demographics.historical.gender.map((_: any, i: number) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
}
