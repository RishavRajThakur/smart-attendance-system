import React from 'react';

interface FacultyPageProps {
  onNavigate: (page: string) => void;
}

export const FacultyPage: React.FC<FacultyPageProps> = ({ onNavigate }) => {
  const facultyMembers = [
    {
      id: 1,
      name: 'Prof. Manas Ranjan Biswal',
      title: 'Assistant Professor & Lab Lead',
      department: 'Computer Science & Engineering',
      email: 'manas.biswal@college.edu',
      status: 'Active Now',
      avatar: '/assets/prof_manas.jpg',
      courses: ['Data Structures (CSE-302)', 'Computer Networks (CSE-306)'],
      isCurrentUser: true
    },
    {
      id: 2,
      name: 'Dr. R. K. Mishra',
      title: 'Professor & Head of Department (HOD)',
      department: 'Computer Science & Engineering',
      email: 'hod.cse@college.edu',
      status: 'Office Hours',
      avatar: '/assets/grad_cap_book.jpg',
      courses: ['Database Management (CSE-304)'],
      isCurrentUser: false
    },
    {
      id: 3,
      name: 'Prof. Ananya Sen',
      title: 'Associate Professor',
      department: 'Computer Science & Engineering',
      email: 'ananya.sen@college.edu',
      status: 'In Lecture',
      avatar: '/assets/student_priya.jpg',
      courses: ['Software Engineering (CSE-308)'],
      isCurrentUser: false
    }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto select-none">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 font-heading">Faculty & Course Instructors</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('kiosk')}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition cursor-pointer"
          >
            Launch Take Attendance
          </button>
        </div>
      </div>

      {/* 3 Department Stat Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Total Faculty Members</div>
            <div className="text-2xl font-extrabold text-slate-900 font-heading mt-1">43</div>
          </div>
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-600">+2 New</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Assigned Courses</div>
            <div className="text-2xl font-extrabold text-slate-900 font-heading mt-1">4 Active</div>
          </div>
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-600">7th Sem B.Tech</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Biometric AI Terminals</div>
            <div className="text-2xl font-extrabold text-slate-900 font-heading mt-1">1 Online</div>
          </div>
        </div>
      </div>

      {/* Faculty Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {facultyMembers.map((fac) => (
          <div key={fac.id} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition">
            <div>
              <div className="flex items-center gap-3.5 mb-4">
                <img
                  src={fac.avatar}
                  alt={fac.name}
                  className="w-13 h-13 rounded-full object-cover border-2 border-blue-100"
                />
                <div>
                  <div className="text-sm font-bold text-slate-900 leading-tight flex items-center gap-1.5">
                    <span>{fac.name}</span>
                    {fac.isCurrentUser && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">You</span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">{fac.title}</div>
                </div>
              </div>

              <div className="space-y-2 text-xs pt-3 border-t border-slate-100">
                <div className="text-slate-500">
                  <strong className="text-slate-700">Department:</strong> {fac.department}
                </div>
                <div className="text-slate-500">
                  <strong className="text-slate-700">Email:</strong> {fac.email}
                </div>
                <div>
                  <div className="text-slate-700 font-bold mb-1">Courses Taught:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {fac.courses.map((c, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-semibold text-emerald-600 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>{fac.status}</span>
              </span>
              <button
                onClick={() => onNavigate('kiosk')}
                className="text-blue-600 hover:text-blue-700 font-bold hover:underline"
              >
                Start Session &rarr;
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
