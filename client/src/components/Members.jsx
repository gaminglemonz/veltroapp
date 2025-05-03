import React from 'react';
export default function Members({ members }){
    members.forEach(member => {
        return (
            <div class="flex items-center my-10">
                <img src={`member.avatar`} alt="{member.username}'s Avatar" width="30" class="mr-3 rounded-full" />
                <span class="text-gray-500 text-md dark:text-gray-200 username">{member.username}</span>
            </div>
        );
    })
}