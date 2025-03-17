import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const editor = (data) => {
    function previewImage(input) {
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
                document.getElementById('avatar-preview').src = e.target.result;
            }
            reader.readAsDataURL(input.files[0]);
        }
    }

    function closeEditProfile() {
        document.getElementById('editProfile').classList.add('hidden');
        document.getElementById('editProfile').classList.remove('flex');
    }

    const username = document.getElementById("usernameEditor");
    const name = document.getElementById("nameEditor");

    const toggleEditUsername = (type) => {
        switch (type) {
            case "edit":
                username.innerHTML = `
                    <form action="/update-username" method="POST">
                        <label class="block font-bold text-xl" for="new-username">Username</label>
                        <input
                            class="block dark:bg-slate-600 dark:text-white focus:outline-none font-regular text-xl border-gray-300 rounded-lg my-4 p-2"
                            value="<%= user.username %>"
                            name="username"
                            type="text"
                            autocomplete="username"
                            required
                        />
                        <button onclick='window.location.href="/profile"' class="bg-black font-bold text-lg text-white my-2 p-3 rounded-md inline">Cancel</button>
                        <button type="submit" class="bg-black font-bold text-lg text-white my-2 mx-2 p-3 rounded-md inline">Done</button>
                    </form>
                `;
                break;
            case "done":
                username.innerHTML = `
                    <h2 id="username" class="font-bold text-3xl leading-normal mr-4">
                        <%= user.username %>
                    </h2>
                    <i onclick="toggleEditUsername('edit')" class="material-icons mx-4 cursor-pointer">edit</i>
                `;
                break;
        }
    };

    const toggleEditName = (type) => {
        switch (type) {
            case "edit":
                name.innerHTML = `
                    <form action="/update-name" method="POST">
                        <label class="block font-bold text-xl" for="new-name">Name</label>
                        <input
                            class="block dark:bg-slate-600 dark:text-white focus:outline-none font-regular text-xl border-gray-300 rounded-lg my-4 p-2"
                            value="<%= user.name %>"
                            name="name"
                            type="text"
                            autocomplete="name"
                            required
                        />
                        <button onclick='window.location.href="/profile"' class="bg-black font-bold text-lg text-white my-2 p-3 rounded-md inline">Cancel</button>
                        <button type="submit" class="bg-black font-bold text-lg text-white my-2 mx-2 p-3 rounded-md inline">Done</button>
                    </form>
                `;
                break;
            case "done":
                name.innerHTML = `
                    <h2 id="name" class="font-bold text-3xl leading-normal mr-4">
                        <%= user.name %>
                    </h2>
                    <i onclick="toggleEditName('edit')" class="material-icons mx-4 cursor-pointer">edit</i>
                `;
                break;
        }
    };

    const editProfile = document.getElementById("editProfile");
    document.querySelector('.toggle-editing').addEventListener('click', () => {
        editProfile.classList.remove('hidden');
    });
};