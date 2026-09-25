import React from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../Navbar';
import SchoolWorkspace from './SchoolWorkspace';

// /school (principal's own school) and /school/:schoolId (admin opening any school).
const SchoolPage = () => {
  const { schoolId } = useParams();
  return (
    <>
      <Navbar />
      <SchoolWorkspace key={schoolId || 'mine'} schoolId={schoolId} />
    </>
  );
};

export default SchoolPage;
