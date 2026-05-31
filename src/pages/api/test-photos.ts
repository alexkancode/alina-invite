import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const tests = [];

    // Test disco-ball photos
    try {
      const discoResponse = await fetch('http://localhost:4321/api/photos/disco-ball?count=5');
      const discoData = await discoResponse.json();
      tests.push({
        test: 'Disco Ball Photos',
        status: discoResponse.ok ? 'PASS' : 'FAIL',
        data: discoData
      });
    } catch (error) {
      tests.push({
        test: 'Disco Ball Photos',
        status: 'ERROR',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test minigame photos
    try {
      const minigameResponse = await fetch('http://localhost:4321/api/photos/minigame?count=8');
      const minigameData = await minigameResponse.json();
      tests.push({
        test: 'Minigame Photos',
        status: minigameResponse.ok ? 'PASS' : 'FAIL',
        data: minigameData
      });
    } catch (error) {
      tests.push({
        test: 'Minigame Photos',
        status: 'ERROR',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    return new Response(JSON.stringify({
      timestamp: new Date().toISOString(),
      tests,
      summary: {
        passed: tests.filter(t => t.status === 'PASS').length,
        total: tests.length
      }
    }, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Test suite failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};